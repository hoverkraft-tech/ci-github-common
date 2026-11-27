import fs from "node:fs";
import path from "node:path";
import { XMLValidator } from "fast-xml-parser";
import { ParserFactory } from "../../parse-ci-reports/src/parsers/ParserFactory.js";
import { CoberturaReport } from "./CoberturaReport.js";
import { Protocol } from "./Protocol.js";

/** Validate native formats without installing or executing project dependencies. */
export class NativeReports {
	constructor() {
		this.parsers = new ParserFactory(null).parsers;
	}

	parse(content, filename, kind) {
		if (Buffer.byteLength(content) > Protocol.maxFileBytes)
			throw new Error("Native report exceeds 64 MiB.");
		// Cobertura generators commonly emit an external DTD. It is metadata,
		// never fetched; internal subsets and entity declarations remain rejected.
		if (kind === "coverage")
			content = content.replace(
				/<!DOCTYPE coverage SYSTEM ["'][^"'<>\r\n]+["']\s*>/g,
				"",
			);
		if (
			kind === "lint" &&
			path.basename(filename) === "super-linter-summary.md"
		) {
			if (!content.trim() || !/^\|.*\|/m.test(content))
				throw new Error("Expected the native Super-Linter summary table.");
			return {
				format: "super-linter-summary",
				data: { tests: [], lintIssues: [], summary: content },
				sourceFiles: [],
			};
		}
		if (
			content.trimStart().startsWith("<") &&
			(/<!DOCTYPE\b|<!ENTITY\b/i.test(content) ||
				XMLValidator.validate(content) !== true)
		)
			throw new Error(
				"Invalid XML or unsafe XML declarations in native report.",
			);
		const candidates = this.parsers.filter(
			(parser) =>
				parser.getCategory() === kind && parser.canParse(filename, content),
		);
		if (candidates.length !== 1)
			throw new Error(
				`Expected one supported ${kind} format for ${filename}; found ${candidates.length}.`,
			);
		const parser = candidates[0];
		const data = parser.parse(content, filename);
		if (kind === "test" && !data.tests.length)
			throw new Error("Required test report has no test cases.");
		if (
			kind === "coverage" &&
			(!data.coverage || data.coverage.lines.total < 1)
		)
			throw new Error("Required coverage report has no instrumented lines.");
		const format = parser.constructor.name.replace(/Parser$/, "").toLowerCase();
		let sourceFiles = [];
		if (format === "cobertura")
			sourceFiles = new CoberturaReport(content).classes.map(
				(entry) => entry["@_filename"],
			);
		if (format === "lcov") {
			sourceFiles = [...content.matchAll(/^SF:(.+)$/gm)].map((match) =>
				match[1].trim(),
			);
			if (
				!sourceFiles.length ||
				(content.match(/^end_of_record\s*$/gm) || []).length !==
					sourceFiles.length
			)
				throw new Error(
					"LCOV records must identify sources and end with end_of_record.",
				);
			if (new Set(sourceFiles).size !== sourceFiles.length)
				throw new Error("Duplicate LCOV sources require a native merge.");
			for (const record of content.split("end_of_record").slice(0, -1)) {
				const lines = [...record.matchAll(/^DA:(.+)$/gm)].map((match) =>
					match[1].split(","),
				);
				if (
					lines.some(
						([line, hits]) =>
							!/^\d+$/.test(line) ||
							Number(line) < 1 ||
							!/^\d+$/.test(hits) ||
							!Number.isSafeInteger(Number(hits)),
					) ||
					new Set(lines.map(([line]) => line)).size !== lines.length
				)
					throw new Error("Invalid or duplicate LCOV line measurements.");
			}
		}
		return { format, data: JSON.parse(JSON.stringify(data)), sourceFiles };
	}

	static mapPath(
		filename,
		{ workspace, project, mappings = {} },
		required = false,
	) {
		if (!filename) return "";
		let input = filename.replace(/\\/g, "/");
		const mapped = Object.entries(mappings).filter(
			([prefix]) => input === prefix || input.startsWith(`${prefix}/`),
		);
		if (mapped.length > 1)
			throw new Error(`Conflicting source mappings for ${filename}.`);
		if (mapped.length)
			input = path.posix.join(mapped[0][1], input.slice(mapped[0][0].length));
		const candidates = [
			path.resolve(workspace, project, input),
			path.resolve(workspace, input),
		];
		const matches = new Set();
		for (const candidate of candidates) {
			if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile())
				continue;
			const relative = path
				.relative(fs.realpathSync(workspace), fs.realpathSync(candidate))
				.split(path.sep)
				.join("/");
			Protocol.relative(relative);
			matches.add(relative);
		}
		if (matches.size > 1 || (required && matches.size !== 1))
			throw new Error(
				`Source must resolve to one repository file: ${filename}`,
			);
		return [...matches][0] || "";
	}

	static language(files) {
		const languages = {
			".js": "JavaScript",
			".jsx": "JavaScript",
			".mjs": "JavaScript",
			".cjs": "JavaScript",
			".ts": "TypeScript",
			".tsx": "TypeScript",
			".py": "Python",
			".go": "Go",
			".php": "PHP",
			".java": "Java",
			".rs": "Rust",
			".rb": "Ruby",
			".cs": "C#",
		};
		const detected = new Set(
			files.map((file) => languages[path.extname(file)]),
		);
		if (detected.size === 1 && !detected.has(undefined))
			return [...detected][0];
		throw new Error(
			"Coverage language is ambiguous. Use the language-specific action to supply the dataset language.",
		);
	}

	static measurement(content, format, sourceMap) {
		const lines = new Map();
		const add = (source, number, hits) => {
			const key = `${sourceMap[source]}:${number}`;
			lines.set(key, lines.get(key) || Number(hits) > 0);
		};
		if (format === "lcov") {
			let source;
			for (const line of content.split(/\r?\n/)) {
				if (line.startsWith("SF:")) source = line.slice(3).trim();
				if (line.startsWith("DA:")) {
					const [number, hits] = line.slice(3).split(",");
					add(source, Number(number), hits);
				}
			}
		} else if (format === "cobertura") {
			for (const item of new CoberturaReport(content).classes)
				for (const line of CoberturaReport.array(item.lines?.line))
					add(item["@_filename"], Number(line["@_number"]), line["@_hits"]);
		}
		if (!lines.size)
			throw new Error("Coverage has no comparable source line measurements.");
		const covered = [...lines.values()].filter(Boolean).length;
		return {
			measurementDigest: Protocol.digest(
				JSON.stringify(
					[...lines].sort(([left], [right]) => left.localeCompare(right)),
				),
			),
			lines: {
				total: lines.size,
				covered,
				percentage: (covered / lines.size) * 100,
			},
		};
	}

	validate(directory, definition, workspace) {
		const assets = [];
		const errors = [];
		const found = new Map();
		let totalBytes = 0;
		for (const selector of definition.reports) {
			const matches = [...fs.globSync(selector.pattern, { cwd: directory })];
			if (!matches.length && !selector.optional)
				errors.push(
					`Missing required ${selector.kind} report: ${selector.pattern}`,
				);
			for (const relative of matches) {
				try {
					if (found.has(relative)) {
						if (
							JSON.stringify(found.get(relative)) !== JSON.stringify(selector)
						)
							throw new Error(`Conflicting report selectors for ${relative}.`);
						continue;
					}
					found.set(relative, selector);
					const file = Protocol.file(directory, relative);
					const bytes = fs.readFileSync(file);
					totalBytes += bytes.length;
					if (totalBytes > Protocol.maxBundleBytes || assets.length >= 512)
						throw new Error("Report bundle exceeds its resource limit.");
					const parsed = this.parse(
						bytes.toString("utf8"),
						relative,
						selector.kind,
					);
					const sourceMap = {};
					const options = {
						workspace,
						project: definition.project,
						mappings: definition["path-mapping"],
					};
					if (parsed.format === "cobertura") {
						const report = new CoberturaReport(bytes.toString("utf8"));
						const originals = report.classes.map((item) => item["@_filename"]);
						report.normalize({
							project: path.join(workspace, definition.project),
							repository: workspace,
							prefix: definition.project === "." ? "" : definition.project,
						});
						report.classes.forEach((item, index) => {
							sourceMap[originals[index]] = item["@_filename"];
						});
					} else
						for (const source of parsed.sourceFiles)
							sourceMap[source] = NativeReports.mapPath(source, options, true);
					for (const item of [
						...parsed.data.tests,
						...parsed.data.lintIssues,
					]) {
						if (item.file)
							sourceMap[item.file] = NativeReports.mapPath(item.file, options);
						item.file = sourceMap[item.file] || "";
					}
					if (selector.kind === "coverage") {
						const measurement = NativeReports.measurement(
							bytes.toString("utf8"),
							parsed.format,
							sourceMap,
						);
						parsed.measurementDigest = measurement.measurementDigest;
						parsed.data.coverage.lines = measurement.lines;
					}
					assets.push({
						file: relative,
						size: bytes.length,
						sha256: Protocol.digest(bytes),
						selector,
						...(selector.kind === "coverage"
							? {
									language:
										selector.language ||
										NativeReports.language(Object.values(sourceMap)),
								}
							: {}),
						...parsed,
						sourceMap,
					});
				} catch (error) {
					errors.push(`${relative}: ${error.message}`);
					// Preserve safe malformed evidence for diagnosis, never for publication.
					try {
						const bytes = fs.readFileSync(Protocol.file(directory, relative));
						if (
							totalBytes <= Protocol.maxBundleBytes &&
							assets.length < 512 &&
							!assets.some((asset) => asset.file === relative)
						)
							assets.push({
								file: relative,
								size: bytes.length,
								sha256: Protocol.digest(bytes),
								selector,
								invalid: error.message,
							});
					} catch {
						// Symlinks, directories and oversized files are not retained.
					}
				}
			}
		}
		return { assets, errors };
	}

	verify(directory, asset) {
		const bytes = fs.readFileSync(Protocol.file(directory, asset.file));
		if (asset.size !== bytes.length || asset.sha256 !== Protocol.digest(bytes))
			throw new Error("Report asset integrity check failed.");
		if (asset.invalid) {
			if (typeof asset.invalid !== "string")
				throw new Error("Invalid diagnostic reason.");
			return {
				file: asset.file,
				size: asset.size,
				sha256: asset.sha256,
				selector: asset.selector,
				invalid: asset.invalid,
			};
		}
		const parsed = this.parse(
			bytes.toString("utf8"),
			asset.file,
			asset.selector.kind,
		);
		if (parsed.format !== asset.format)
			throw new Error("Native report format changed.");
		for (const value of Object.values(asset.sourceMap || {}))
			if (value) Protocol.relative(value);
		for (const source of parsed.sourceFiles)
			if (!asset.sourceMap[source])
				throw new Error("Coverage source mapping is incomplete.");
		for (const item of [...parsed.data.tests, ...parsed.data.lintIssues])
			item.file = asset.sourceMap[item.file] || "";
		if (asset.selector.kind === "coverage") {
			const measurement = NativeReports.measurement(
				bytes.toString("utf8"),
				parsed.format,
				asset.sourceMap,
			);
			parsed.measurementDigest = measurement.measurementDigest;
			parsed.data.coverage.lines = measurement.lines;
			parsed.language =
				asset.selector.language ||
				NativeReports.language(Object.values(asset.sourceMap));
		}
		return { ...asset, ...parsed };
	}
}
