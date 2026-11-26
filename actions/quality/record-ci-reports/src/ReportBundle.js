import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { CoverageReports } from "./CoverageReports.js";
import { ReportPlan } from "./ReportPlan.js";

/** Transfer report data independently of producer job names and publication policy. */
export class ReportBundle {
	static compose({ directory, runUrl, tests, lint, coverage, parseOutcome }) {
		const collection = ReportBundle.readJson(directory, "collection.json");
		if (collection.reportFiles.length && parseOutcome !== "success")
			collection.errors.push(
				"Some report data could not be parsed. Available diagnostics are shown below.",
			);
		collection.complete = collection.errors.length === 0;
		const outcomes = ["success", "failure", "cancelled", "skipped", "abandoned"]
			.map(
				(result) =>
					`${Object.values(collection.jobs).filter((job) => job.result === result).length} ${result}`,
			)
			.join(" · ");
		const lines = [
			`[Workflow run and full artifacts](${runUrl})`,
			`**Jobs:** ${outcomes}.`,
		];
		if (collection.errors.length)
			lines.push(
				"**Reporting incomplete:**\n" +
					collection.errors
						.slice(0, 50)
						.map((error) => `- ${error.replace(/[<>]/g, "").slice(0, 500)}`)
						.join("\n"),
			);
		if (tests) lines.push(tests);
		if (lint) lines.push(lint);
		for (const summary of collection.summaries) {
			const content = fs.readFileSync(
				ReportBundle.file(directory, summary.file),
				"utf8",
			);
			lines.push(
				`<details>\n<summary>${summary.label}</summary>\n\n${content.length < 15000 ? content : `See the full artifact in the [workflow run](${runUrl}).`}\n\n</details>`,
			);
		}
		if (collection.provider === "github")
			lines.push(
				"**Coverage:** Native GitHub publication requested. The completion check includes publication.",
			);
		else if (coverage) lines.push(coverage);
		const rows = collection.statuses
			.map(
				(item) =>
					`| ${item.label} | ${item.key} | ${item.job} | ${item.reports} | ${item.sha ? item.sha.slice(0, 7) : "unknown"} |`,
			)
			.join("\n");
		lines.push(
			`<details>\n<summary>Report availability</summary>\n\n| Component | Execution | Job | Files | Commit |\n| --- | --- | --- | --- | --- |\n${rows}\n\nOnly the current attempt is included. Rerun all producers after a partial rerun.\n\n</details>`,
		);
		let markdown = lines.join("\n\n");
		if (markdown.length > 60000)
			markdown = `${lines.slice(0, collection.errors.length ? 3 : 2).join("\n\n")}\n\nDetailed results exceed the comment limit. [Read the full artifacts](${runUrl}).`;
		fs.writeFileSync(path.join(directory, "summary.md"), markdown);
		fs.writeFileSync(
			path.join(directory, "collection.json"),
			JSON.stringify(collection),
		);
		return { markdown, complete: collection.complete };
	}
	constructor({ identity, temporaryDirectory }) {
		this.identity = identity;
		this.planIdentity = Object.fromEntries(
			Object.entries(identity).filter(([key]) => key !== "sha"),
		);
		this.plans = new ReportPlan(this.planIdentity);
		this.temporaryDirectory = fs.realpathSync(temporaryDirectory);
		this.coverage = new CoverageReports({ identity, temporaryDirectory });
	}

	plan({ producers, plan }) {
		const result = plan
			? this.plans.validate(plan)
			: this.plans.create(producers);
		return { plan: result, selections: ReportPlan.selections(result) };
	}

	static file(directory, filename) {
		if (
			!filename ||
			path.isAbsolute(filename) ||
			filename.includes("\\") ||
			filename.split("/").some((part) => !part || part === "." || part === "..")
		)
			throw new Error("Unsafe report artifact path.");
		const file = path.join(directory, filename);
		if (!fs.lstatSync(file).isFile() || fs.realpathSync(file) !== file)
			throw new Error(
				"Report artifacts must contain regular files, not symlinks.",
			);
		return file;
	}

	static readJson(directory, filename) {
		const file = ReportBundle.file(directory, filename);
		if (fs.statSync(file).size > 4 * 1024 * 1024)
			throw new Error("Report metadata exceeds 4 MiB.");
		return JSON.parse(fs.readFileSync(file, "utf8"));
	}

	record({
		directory,
		workspace,
		plan,
		files = [],
		categories = [],
		testCount,
		summaryFile = "",
		sourceSha = "",
		sourcePrefix = "",
		parseOutcome = "success",
		summaries = {},
		metadata = {},
	}) {
		plan = this.plans.validate(plan);
		if (plan.producers.length !== 1)
			throw new Error("Record exactly one planned producer execution.");
		const producer = plan.producers[0];
		metadata = ReportPlan.parse(metadata);
		if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
			throw new Error("Report metadata must be a JSON object.");
		const project = fs.realpathSync(directory);
		const stage = fs.mkdtempSync(
			path.join(this.temporaryDirectory, "ci-report-"),
		);
		const errors = [];
		let actualSha = sourceSha;
		try {
			actualSha = execFileSync("git", ["-C", project, "rev-parse", "HEAD"], {
				encoding: "utf8",
				stdio: ["ignore", "pipe", "pipe"],
			}).trim();
		} catch {
			// Diagnostics from prebuilt containers may have no source metadata.
			// Coverage preparation below still requires an explicit, matching revision.
			actualSha = sourceSha;
		}
		if (actualSha && !/^[a-f0-9]{40}$/.test(actualSha))
			errors.push("Invalid report source commit.");
		if (sourceSha && sourceSha !== actualSha)
			errors.push("source-sha differs from the actual checkout.");
		if (parseOutcome !== "success" && !summaryFile)
			errors.push(
				"Report parsing did not complete. Available diagnostics are retained.",
			);
		const records = [];
		categories = ReportPlan.parse(categories);
		if (
			producer.type === "test" &&
			testCount !== undefined &&
			Number(testCount) < 1
		)
			errors.push(
				"No executed tests were reported. Disable intentionally absent producers in the plan.",
			);
		files = ReportPlan.parse(files);
		if (!Array.isArray(files))
			throw new Error("Parsed files must be an array.");
		if (summaryFile) files.push(path.resolve(project, summaryFile));
		const coverageFiles = new Set(
			producer.coverage.map((report) => path.resolve(project, report.file)),
		);
		for (const [index, input] of [...new Set(files)].entries()) {
			try {
				const real = fs.realpathSync(input);
				if (
					!fs.lstatSync(input).isFile() ||
					real !== input ||
					!real.startsWith(`${project}${path.sep}`)
				)
					throw new Error(
						"Report file is outside the project or is not a regular file.",
					);
				if (fs.statSync(real).size > 64 * 1024 * 1024)
					throw new Error("Report file exceeds 64 MiB.");
				if (coverageFiles.has(real)) continue;
				const file = `reports/${index}/${path.basename(real)}`;
				fs.mkdirSync(path.dirname(path.join(stage, file)), { recursive: true });
				const content = fs.readFileSync(real);
				fs.writeFileSync(path.join(stage, file), content);
				const type =
					categories.find((item) => item.file === input)?.type || producer.type;
				records.push({
					file,
					sha256: CoverageReports.digest(content),
					type:
						summaryFile && real === path.resolve(project, summaryFile)
							? "summary"
							: type === "coverage" && producer.coverage.length
								? "attachment"
								: type,
				});
			} catch (error) {
				errors.push(`${input}: ${error.message}`);
			}
		}
		if (!records.length)
			errors.push(
				`No ${producer.type} reports were produced for ${producer.label}. Configure a native report in the tool command.`,
			);
		if (producer.coverage.length) {
			let prepared;
			try {
				prepared = this.coverage.prepare({
					directory: project,
					workspace,
					reports: producer.coverage,
					group: "coverage",
					sourceSha,
					sourcePrefix,
				});
				fs.renameSync(prepared.directory, path.join(stage, "coverage"));
				for (const report of prepared.reports)
					records.push({
						file: `coverage/${report.file}`,
						sha256: report.sha256,
						type: "coverage",
					});
			} catch (error) {
				errors.push(error.message);
			}
		}
		const manifest = {
			version: 1,
			identity: this.planIdentity,
			sha: actualSha,
			plan,
			files: records,
			errors,
			summaries,
			metadata,
		};
		fs.writeFileSync(
			path.join(stage, "ci-report.json"),
			JSON.stringify(manifest),
		);
		return {
			directory: stage,
			name: `ci-reports-${this.identity.attempt}-${plan.group}-${producer.key}`,
			complete: errors.length === 0,
			errors,
			plan,
		};
	}

	read(directory, expected) {
		const manifest = ReportBundle.readJson(directory, "ci-report.json");
		if (manifest.version !== 1 || !isDeepStrictEqual(manifest.plan, expected))
			throw new Error("Report bundle does not match its expected plan.");
		if (
			Object.entries(this.planIdentity).some(
				([key, value]) => manifest.identity?.[key] !== value,
			)
		)
			throw new Error("Stale report bundle repository, run or attempt.");
		if (manifest.sha !== "" && !/^[a-f0-9]{40}$/.test(manifest.sha))
			throw new Error("Report bundle has no valid source commit.");
		if (!Array.isArray(manifest.files) || !Array.isArray(manifest.errors))
			throw new Error("Invalid report bundle metadata.");
		for (const record of manifest.files) {
			const file = ReportBundle.file(directory, record.file);
			if (CoverageReports.digest(fs.readFileSync(file)) !== record.sha256)
				throw new Error("Report artifact checksum mismatch.");
		}
		return manifest;
	}

	discover({ jobs }) {
		const plans = this.plans.fromJobs(jobs);
		if (!Object.keys(jobs).length)
			throw new Error("job-results must not be empty.");
		const names = [...plans.keys()].map(
			(id) => `ci-reports-${this.identity.attempt}-${id}`,
		);
		return {
			pattern:
				names.length > 1
					? `{${names.join(",")}}`
					: names[0] || "ci-reports-no-producers",
			count: plans.size,
		};
	}

	collect({ directory, jobs, provider = "none" }) {
		if (!["none", "github", "codecov"].includes(provider))
			throw new Error("coverage must be none, github or codecov.");
		const plans = this.plans.fromJobs(jobs);
		const errors = [];
		for (const [job, value] of Object.entries(jobs)) {
			if (value.result !== "success")
				errors.push(
					`${job}: ${value.result}. Required producer jobs must succeed.`,
				);
			if (
				!value.outputs?.["report-plan"] &&
				![...plans.values()].some((entry) => entry.producer.job === job)
			)
				errors.push(
					`${job}: no report-plan output. Use an updated producer workflow, or forward the recording action's report-plan output. For an outer matrix, forward its complete configuration plan.`,
				);
		}
		const root = fs.realpathSync(directory);
		const flat = fs.existsSync(path.join(root, "ci-report.json"));
		const stage = fs.mkdtempSync(
			path.join(this.temporaryDirectory, "ci-report-collection-"),
		);
		const coverageIncoming = path.join(stage, "coverage-incoming");
		fs.mkdirSync(coverageIncoming);
		const reportFiles = [],
			summaries = [],
			expectedCoverage = [];
		const statuses = [];
		for (const [id, expected] of plans) {
			const artifact =
				flat && plans.size === 1
					? root
					: path.join(root, `ci-reports-${this.identity.attempt}-${id}`);
			const producer = expected.producer;
			try {
				const manifest = this.read(artifact, expected.plan);
				errors.push(
					...manifest.errors.map(
						(error) => `${producer.label} (${producer.key}): ${error}`,
					),
				);
				const prefix = `${producer.label} (${producer.key})`;
				statuses.push({
					label: producer.label,
					key: producer.key,
					job: expected.job,
					reports: manifest.files.length,
					sha: manifest.sha,
					metadata: manifest.metadata || {},
				});
				for (const record of manifest.files) {
					const relative = `reports/${producer.label}/${producer.key}/${record.file}`;
					const destination = path.join(stage, relative);
					if (fs.existsSync(destination))
						throw new Error(
							`Duplicate logical report ${producer.label} (${producer.key}). Give independent producers distinct labels.`,
						);
					fs.mkdirSync(path.dirname(destination), { recursive: true });
					fs.copyFileSync(
						ReportBundle.file(artifact, record.file),
						destination,
					);
					if (record.type === "summary")
						summaries.push({ label: prefix, file: relative });
					else if (record.type !== "attachment") reportFiles.push(relative);
				}
				if (producer.coverage.length) {
					const reports = this.coverage.read(path.join(artifact, "coverage"));
					if (
						JSON.stringify(
							reports.map(({ label, language }) => ({ label, language })),
						) !==
						JSON.stringify(
							producer.coverage.map(({ label, language }) => ({
								label,
								language,
							})),
						)
					)
						throw new Error(
							"Coverage components differ from the declared plan.",
						);
					fs.cpSync(
						path.join(artifact, "coverage"),
						path.join(coverageIncoming, id),
						{ recursive: true },
					);
					for (const report of producer.coverage)
						expectedCoverage.push({ job: "coverage", label: report.label });
				}
			} catch (error) {
				errors.push(
					`${producer.label} (${producer.key}): ${error.code === "ENOENT" ? "Reports unavailable. Rerun all producer jobs for this attempt." : error.message}`,
				);
			}
		}
		let coverageReports = [];
		if (!errors.length && expectedCoverage.length) {
			try {
				const collection = this.coverage.collect({
					directory: coverageIncoming,
					expected: expectedCoverage,
					jobs: { coverage: { result: "success" } },
				});
				fs.renameSync(collection.directory, path.join(stage, "coverage"));
				coverageReports = collection.reports.map(
					({ file, language, label }) => ({ file, language, label }),
				);
			} catch (error) {
				errors.push(error.message);
			}
		}
		if (provider !== "none" && !expectedCoverage.length)
			errors.push(
				"Coverage publication requires coverage-producing tests in the report plan.",
			);
		fs.rmSync(coverageIncoming, { recursive: true, force: true });
		const result = {
			version: 1,
			identity: this.identity,
			jobs,
			statuses,
			errors,
			summaries,
			reportFiles,
			coverageReports,
			provider,
			complete: errors.length === 0,
		};
		fs.writeFileSync(
			path.join(stage, "collection.json"),
			JSON.stringify(result),
		);
		return {
			directory: stage,
			name: `ci-report-collection-${this.identity.attempt}-${path.basename(stage)}`,
			complete: result.complete,
			reports: coverageReports,
			"report-paths": reportFiles
				.map((file) => path.join(stage, file))
				.join("\n"),
			collection: result,
		};
	}
}
