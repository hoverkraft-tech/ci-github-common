import fs from "node:fs";
import path from "node:path";
import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";

export class CoberturaReport {
	constructor(content) {
		if (
			/<!ENTITY\b/i.test(content) ||
			XMLValidator.validate(content) !== true
		) {
			throw new Error(
				"Coverage must be valid Cobertura XML without entity declarations.",
			);
		}
		this.document = new XMLParser({
			ignoreAttributes: false,
			parseAttributeValue: false,
		}).parse(content);
		const coverage = this.document.coverage;
		if (
			!coverage ||
			!Number.isFinite(Number(coverage["@_line-rate"])) ||
			Number(coverage["@_line-rate"]) < 0 ||
			Number(coverage["@_line-rate"]) > 1
		) {
			throw new Error(
				"Expected Cobertura coverage with a line-rate between 0 and 1.",
			);
		}
		this.classes = CoberturaReport.array(coverage.packages?.package).flatMap(
			(pkg) => CoberturaReport.array(pkg.classes?.class),
		);
		let lines = 0;
		for (const cls of this.classes) {
			if (typeof cls["@_filename"] !== "string" || !cls["@_filename"])
				throw new Error("Coverage class has no filename.");
			for (const line of CoberturaReport.array(cls.lines?.line)) {
				if (
					!Number.isSafeInteger(Number(line["@_number"])) ||
					Number(line["@_number"]) < 1 ||
					!Number.isSafeInteger(Number(line["@_hits"])) ||
					Number(line["@_hits"]) < 0
				) {
					throw new Error(
						"Coverage line numbers and hit counts must be nonnegative integers (lines start at 1).",
					);
				}
				lines++;
			}
		}
		if (!lines)
			throw new Error("Coverage report contains no instrumented lines.");
	}

	static array(value) {
		return value === undefined ? [] : Array.isArray(value) ? value : [value];
	}

	static relative(value) {
		if (
			typeof value !== "string" ||
			!value ||
			value.includes("\\") ||
			[...value].some((character) => character.charCodeAt(0) < 32) ||
			path.posix.isAbsolute(value) ||
			value.split("/").some((part) => !part || part === ".." || part === ".")
		) {
			throw new Error(`Expected a repository-relative source path: ${value}`);
		}
		return value;
	}

	normalize({ project, repository, prefix }) {
		const sources = CoberturaReport.array(
			this.document.coverage.sources?.source,
		).map(String);
		for (const cls of this.classes) {
			const filename = cls["@_filename"];
			const matches = new Set();
			const roots = [
				sources.map((source) => path.resolve(project, source, filename)),
				[path.resolve(project, filename)],
				[path.resolve(repository, filename)],
			];
			for (const candidates of roots) {
				for (const candidate of new Set(candidates)) {
					if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile())
						continue;
					const real = fs.realpathSync(candidate);
					const fromProject = path.relative(project, real);
					const fromRepository = path.relative(repository, real);
					if (
						fromProject &&
						!fromProject.startsWith(`..${path.sep}`) &&
						fromProject !== ".." &&
						!path.isAbsolute(fromProject)
					) {
						matches.add(
							path.posix.join(prefix, fromProject.split(path.sep).join("/")),
						);
					} else if (
						fromRepository &&
						!fromRepository.startsWith(`..${path.sep}`) &&
						fromRepository !== ".." &&
						!path.isAbsolute(fromRepository)
					) {
						matches.add(fromRepository.split(path.sep).join("/"));
					}
				}
				if (matches.size) break;
			}
			if (matches.size !== 1)
				throw new Error(
					`Coverage source must resolve to exactly one repository file: ${filename}`,
				);
			cls["@_filename"] = CoberturaReport.relative([...matches][0]);
		}
		this.document.coverage.sources = { source: "." };
		// External DTDs and producer paths are not needed in the normalized report.
		delete this.document["!DOCTYPE"];
		return new XMLBuilder({
			ignoreAttributes: false,
			format: true,
			suppressBooleanAttributes: false,
		}).build(this.document);
	}

	files() {
		return [
			...new Set(
				this.classes.map((cls) => CoberturaReport.relative(cls["@_filename"])),
			),
		];
	}
}
