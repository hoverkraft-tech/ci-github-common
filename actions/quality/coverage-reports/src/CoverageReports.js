import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { CoberturaReport } from "./CoberturaReport.js";

export class CoverageReports {
	constructor({ identity, temporaryDirectory }) {
		if (
			!identity ||
			!/^[\w.-]+\/[\w.-]+$/.test(identity.repository) ||
			!/^[a-f0-9]{40}$/.test(identity.sha) ||
			!/^\d+$/.test(identity.runId) ||
			!/^[1-9]\d*$/.test(identity.attempt)
		)
			throw new Error("Invalid coverage run identity.");
		this.identity = identity;
		this.temporaryDirectory = fs.realpathSync(temporaryDirectory);
	}

	static list(value, name) {
		const list = typeof value === "string" ? JSON.parse(value) : value;
		if (
			!Array.isArray(list) ||
			!list.length ||
			list.length > 256 ||
			list.some(
				(item) => !item || typeof item !== "object" || Array.isArray(item),
			)
		) {
			throw new Error(`${name} must contain 1-256 report objects.`);
		}
		return list;
	}

	static label(value) {
		if (typeof value !== "string" || !/^[\w][\w./-]{0,199}$/.test(value))
			throw new Error(
				"Coverage labels must contain 1-200 letters, numbers, underscores, dots, slashes or hyphens.",
			);
		return value;
	}

	static job(value) {
		if (typeof value !== "string" || !/^[\w-]+$/.test(value))
			throw new Error("Coverage report-group must be a job ID.");
		return value;
	}

	static language(value) {
		if (
			typeof value !== "string" ||
			!/^[A-Za-z][A-Za-z0-9 #+.-]{0,79}$/.test(value)
		)
			throw new Error("Coverage reports require a Linguist language name.");
		return value;
	}

	static digest(content) {
		return createHash("sha256").update(content).digest("hex");
	}

	static file(directory, file) {
		if (!/^report-\d+\.xml$/.test(file))
			throw new Error("Unexpected coverage artifact filename.");
		const result = path.join(directory, file);
		if (!fs.lstatSync(result).isFile() || fs.realpathSync(result) !== result)
			throw new Error(
				"Coverage artifacts must contain regular files, not symlinks.",
			);
		return result;
	}

	source(project, workspace, sourceSha, sourcePrefix) {
		let repository;
		let actual;
		let checkout = false;
		try {
			repository = fs.realpathSync(
				execFileSync("git", ["-C", project, "rev-parse", "--show-toplevel"], {
					encoding: "utf8",
					stdio: ["ignore", "pipe", "pipe"],
				}).trim(),
			);
			actual = execFileSync("git", ["-C", project, "rev-parse", "HEAD"], {
				encoding: "utf8",
			}).trim();
			checkout = true;
		} catch {
			if (!sourceSha || sourcePrefix === "")
				throw new Error(
					"Coverage needs a Git checkout, or explicit source-sha and source-prefix for a prebuilt container.",
				);
			repository = workspace;
			actual = sourceSha;
		}
		if (actual !== this.identity.sha || (sourceSha && sourceSha !== actual))
			throw new Error(
				"Coverage must measure the PR head commit (or the current push commit), not a merge commit or another image revision.",
			);
		const checkoutPrefix =
			path.relative(repository, project).split(path.sep).join("/") || ".";
		if (checkout && sourcePrefix && sourcePrefix !== checkoutPrefix)
			throw new Error(
				"source-prefix must match the actual checkout directory.",
			);
		const prefix = sourcePrefix || checkoutPrefix;
		if (prefix !== ".") CoberturaReport.relative(prefix);
		return { project, repository, prefix };
	}

	prepare({
		directory,
		workspace,
		reports,
		group,
		sourceSha = "",
		sourcePrefix = "",
	}) {
		const project = fs.realpathSync(directory);
		const source = this.source(
			project,
			fs.realpathSync(workspace),
			sourceSha,
			sourcePrefix,
		);
		const entries = CoverageReports.list(reports, "reports");
		const labels = new Set();
		const prepared = entries.map((entry) => {
			const label = CoverageReports.label(
				entry.label ||
					(entries.length === 1
						? source.prefix === "."
							? "root"
							: source.prefix
						: ""),
			);
			if (labels.has(label))
				throw new Error(`Duplicate coverage label: ${label}`);
			labels.add(label);
			const file = path.resolve(project, CoberturaReport.relative(entry.file));
			if (
				!fs.lstatSync(file).isFile() ||
				!fs.realpathSync(file).startsWith(`${project}${path.sep}`)
			)
				throw new Error(
					"Coverage report must be a regular file inside working-directory.",
				);
			return {
				label,
				language: CoverageReports.language(entry.language),
				content: new CoberturaReport(fs.readFileSync(file, "utf8")).normalize(
					source,
				),
			};
		});
		return this.write(prepared, CoverageReports.job(group));
	}

	write(reports, group) {
		const directory = fs.mkdtempSync(
			path.join(this.temporaryDirectory, "ci-coverage-"),
		);
		const entries = reports.map(({ content, ...report }, index) => {
			const file = `report-${index}.xml`;
			fs.writeFileSync(path.join(directory, file), content);
			return { ...report, file, sha256: CoverageReports.digest(content) };
		});
		fs.writeFileSync(
			path.join(directory, "manifest.json"),
			JSON.stringify({
				version: 1,
				identity: this.identity,
				group,
				reports: entries,
			}),
		);
		return {
			directory,
			name: `ci-coverage-${this.identity.attempt}-${group}-${randomUUID()}`,
			reports: entries,
		};
	}

	read(directory) {
		const manifestFile = path.join(directory, "manifest.json");
		if (
			!fs.lstatSync(manifestFile).isFile() ||
			fs.realpathSync(manifestFile) !== manifestFile
		)
			throw new Error("Coverage manifest must be a regular file.");
		const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
		if (
			manifest.version !== 1 ||
			Object.entries(this.identity).some(
				([key, value]) => manifest.identity?.[key] !== value,
			)
		)
			throw new Error(
				"Coverage artifact belongs to a different repository, commit, run or attempt.",
			);
		CoverageReports.job(manifest.group);
		const entries = CoverageReports.list(manifest.reports, "manifest reports");
		return entries.map((entry) => {
			CoverageReports.label(entry.label);
			CoverageReports.language(entry.language);
			const content = fs.readFileSync(
				CoverageReports.file(directory, entry.file),
				"utf8",
			);
			if (CoverageReports.digest(content) !== entry.sha256)
				throw new Error(`Coverage artifact checksum mismatch: ${entry.label}`);
			return {
				...entry,
				content,
				group: manifest.group,
				files: new CoberturaReport(content).files(),
			};
		});
	}

	collect({ directory, expected, jobs }) {
		directory = fs.realpathSync(directory);
		const inventory = CoverageReports.list(expected, "expected-reports");
		const labels = new Map();
		for (const report of inventory) {
			CoverageReports.label(report.label);
			CoverageReports.job(report.job);
			if (labels.has(report.label))
				throw new Error(`Duplicate expected coverage label: ${report.label}`);
			if (jobs[report.job]?.result !== "success")
				throw new Error(
					`Coverage producer ${report.job} did not succeed; its artifacts remain available for diagnostics.`,
				);
			labels.set(report.label, report.job);
		}
		const found = new Map();
		const sources = new Map();
		const entries = fs.readdirSync(directory, { withFileTypes: true });
		// The official downloader extracts a single matching artifact directly.
		const single = entries.some((entry) => entry.name === "manifest.json");
		if (
			entries.some((entry) => (single ? !entry.isFile() : !entry.isDirectory()))
		) {
			throw new Error(
				"Coverage collection expects one flat artifact or separate artifact directories.",
			);
		}
		const directories = single
			? [directory]
			: entries.map((entry) => path.join(directory, entry.name));
		for (const artifact of directories) {
			for (const report of this.read(artifact)) {
				if (labels.get(report.label) !== report.group)
					throw new Error(
						`Unexpected coverage component or producer: ${report.label}`,
					);
				if (found.has(report.label))
					throw new Error(
						`Duplicate coverage component: ${report.label}. Publish only the designated runtime version and merge shards first.`,
					);
				for (const file of report.files) {
					if (sources.has(file))
						throw new Error(
							`Overlapping coverage for ${file}: ${sources.get(file)} and ${report.label}. Merge these reports with the test framework first.`,
						);
					sources.set(file, report.label);
				}
				found.set(report.label, report);
			}
		}
		const missing = [...labels.keys()].filter((label) => !found.has(label));
		if (missing.length)
			throw new Error(
				`Missing coverage components: ${missing.join(", ")}. Rerun all producer jobs.`,
			);
		return this.write(
			inventory.map(({ label }) => {
				const { content, language } = found.get(label);
				return { content, language, label };
			}),
			"validated",
		);
	}

	verify({ directory, reports }) {
		const requested = CoverageReports.list(reports, "reports");
		if (requested.length !== 1)
			throw new Error("Verify one publication report at a time.");
		const selected = requested[0];
		const report = this.read(fs.realpathSync(directory)).find(
			(entry) =>
				entry.label === selected.label &&
				entry.file === selected.file &&
				entry.language === selected.language,
		);
		if (report?.group !== "validated")
			throw new Error(
				"Requested report does not match the validated coverage artifact.",
			);
		return {
			file: CoverageReports.file(fs.realpathSync(directory), report.file),
			label: report.label,
			language: report.language,
		};
	}
}
