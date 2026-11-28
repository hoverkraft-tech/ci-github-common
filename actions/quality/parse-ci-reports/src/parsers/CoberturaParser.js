import { XMLParser } from "fast-xml-parser";
import { Coverage, ReportData } from "../models/ReportData.js";
import { BaseParser, ReportCategory } from "./BaseParser.js";

/**
 * Parser for Cobertura XML coverage format
 * Commonly used by Java, Python, and other language coverage tools
 */
export class CoberturaParser extends BaseParser {
	constructor() {
		super();
		this.xmlParser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: "@_",
		});
	}

	canParse(filePath, content) {
		const normalizedPath = filePath.toLowerCase();
		const hasSupportedName =
			this.matchesAutoPatterns(filePath) ||
			normalizedPath.includes("cobertura") ||
			normalizedPath.includes("coverage");

		return (
			hasSupportedName &&
			content.includes("<coverage") &&
			content.includes("line-rate")
		);
	}

	getPriority() {
		return 9;
	}

	getCategory() {
		return ReportCategory.COVERAGE;
	}

	getAutoPatterns() {
		return [
			...this.buildBasenamePatterns(["cobertura.xml"]),
			...this.buildScopedBasenamePatterns("coverage.xml", ["coverage"], {
				includePrefixed: true,
			}),
			...this.buildScopedBasenamePatterns("cobertura.xml", ["coverage"], {
				includePrefixed: true,
			}),
		];
	}

	parse(content) {
		const reportData = new ReportData();
		reportData.reportType = "coverage";

		try {
			const parsed = this.xmlParser.parse(content);
			const coverage = parsed.coverage;

			if (!coverage) {
				throw new Error("Invalid Cobertura format: missing coverage element");
			}

			// Calculate totals from packages if available
			let totalLines = 0;
			let coveredLines = 0;
			let totalBranches = 0;
			let coveredBranches = 0;

			if (coverage.packages?.package) {
				const packages = Array.isArray(coverage.packages.package)
					? coverage.packages.package
					: [coverage.packages.package];

				for (const pkg of packages) {
					const stats = this._calculatePackageStats(pkg);
					totalLines += stats.totalLines;
					coveredLines += stats.coveredLines;
					totalBranches += stats.totalBranches;
					coveredBranches += stats.coveredBranches;
				}
			}

			// Aggregate attributes are actual counts. A percentage alone must
			// never manufacture a denominator of 100 lines or branches.
			const counts = (metric) => {
				const total = Number(coverage[`@_${metric}-valid`] || 0);
				const covered = Number(coverage[`@_${metric}-covered`] || 0);
				if (
					!Number.isSafeInteger(total) ||
					!Number.isSafeInteger(covered) ||
					covered < 0 ||
					covered > total
				)
					throw new Error("Invalid aggregate coverage counts.");
				return [total, covered];
			};
			if (totalLines === 0) [totalLines, coveredLines] = counts("lines");
			if (coverage["@_branches-valid"] !== undefined) {
				// Istanbul can report branches on lines without a statement. These
				// contribute to exact aggregate counts but not class line entries.
				const [total, covered] = counts("branches");
				if (
					total < totalBranches ||
					covered < coveredBranches ||
					total - covered < totalBranches - coveredBranches
				)
					throw new Error(
						"Aggregate branch counts contradict measured branches.",
					);
				[totalBranches, coveredBranches] = [total, covered];
			}

			reportData.setCoverage(
				new Coverage({
					lines: {
						total: totalLines,
						covered: coveredLines,
						percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
					},
					branches: {
						total: totalBranches,
						covered: coveredBranches,
						percentage:
							totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
					},
				}),
			);
		} catch (error) {
			throw new Error(`Failed to parse Cobertura XML: ${error.message}`);
		}

		return reportData;
	}

	_calculatePackageStats(pkg) {
		let totalLines = 0;
		let coveredLines = 0;
		let totalBranches = 0;
		let coveredBranches = 0;

		if (pkg.classes?.class) {
			const classes = Array.isArray(pkg.classes.class)
				? pkg.classes.class
				: [pkg.classes.class];

			for (const cls of classes) {
				if (cls.lines?.line) {
					const lines = Array.isArray(cls.lines.line)
						? cls.lines.line
						: [cls.lines.line];

					for (const line of lines) {
						totalLines++;
						const hits = parseInt(line["@_hits"] || 0, 10);
						if (hits > 0) {
							coveredLines++;
						}

						// Branch coverage
						const branch = line["@_branch"] === "true";
						if (branch) {
							const conditionCoverage = line["@_condition-coverage"] || "0%";
							const match = conditionCoverage.match(/(\d+)\/(\d+)/);
							if (match) {
								const covered = parseInt(match[1], 10);
								const total = parseInt(match[2], 10);
								totalBranches += total;
								coveredBranches += covered;
							}
						}
					}
				}
			}
		}

		return { totalLines, coveredLines, totalBranches, coveredBranches };
	}
}
