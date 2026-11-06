import { fileURLToPath } from "node:url";
import { BaseParser, ReportCategory } from "./BaseParser.js";
import { ReportData, LintIssue } from "../models/ReportData.js";

/**
 * Parser for SARIF 2.1.0 static analysis results
 */
export class SarifParser extends BaseParser {
	canParse(filePath, content) {
		if (!content) {
			return false;
		}

		const normalizedPath = filePath.toLowerCase();
		const hasSupportedName =
			this.matchesAutoPatterns(filePath) ||
			normalizedPath.endsWith(".sarif") ||
			normalizedPath.endsWith(".sarif.json") ||
			normalizedPath.endsWith(".json");

		if (!hasSupportedName) {
			return false;
		}

		try {
			const sarif = JSON.parse(content);
			return (
				typeof sarif.version === "string" &&
				sarif.version.startsWith("2.") &&
				Array.isArray(sarif.runs)
			);
		} catch {
			return false;
		}
	}

	getPriority() {
		return 9;
	}

	getCategory() {
		return ReportCategory.LINT;
	}

	getAutoPatterns() {
		return [
			...this.buildExtensionPatterns(["sarif", "sarif.json"]),
			...this.buildBasenamePatterns(["sarif-report.json"], {
				includePrefixed: true,
			}),
		];
	}

	parse(content) {
		const reportData = new ReportData();
		reportData.reportType = "lint";

		try {
			const sarif = JSON.parse(content);
			const runs = Array.isArray(sarif.runs) ? sarif.runs : [];

			for (const run of runs) {
				this._parseRun(run, reportData);
			}
		} catch (error) {
			throw new Error(`Failed to parse SARIF JSON: ${error.message}`);
		}

		return reportData;
	}

	_parseRun(run, reportData) {
		const results = Array.isArray(run?.results) ? run.results : [];
		if (results.length === 0) {
			return;
		}

		const rules = Array.isArray(run?.tool?.driver?.rules)
			? run.tool.driver.rules
			: [];
		const toolName = run?.tool?.driver?.name || "sarif";

		for (const result of results) {
			const rule = this._resolveRule(result, rules);
			const issue = this._createIssue(result, rule, toolName);

			if (issue) {
				reportData.addLintIssue(issue);
			}
		}
	}

	_resolveRule(result, rules) {
		if (typeof result?.ruleIndex === "number" && rules[result.ruleIndex]) {
			return rules[result.ruleIndex];
		}

		if (!result?.ruleId) {
			return null;
		}

		return rules.find((rule) => rule?.id === result.ruleId) || null;
	}

	_createIssue(result, rule, toolName) {
		const location = result?.locations?.[0]?.physicalLocation;
		const region = location?.region || {};

		return new LintIssue({
			file: this._extractFile(location?.artifactLocation?.uri),
			line: Number.parseInt(region.startLine || 0, 10),
			column: Number.parseInt(region.startColumn || 0, 10),
			severity: this._mapSeverity(
				result?.level || rule?.defaultConfiguration?.level,
			),
			rule: result?.ruleId || rule?.id || "unknown",
			message: this._resolveMessage(result, rule),
			source: toolName,
		});
	}

	_extractFile(uri) {
		if (!uri) {
			return "unknown";
		}

		if (uri.startsWith("file://")) {
			return fileURLToPath(uri);
		}

		try {
			return decodeURIComponent(uri);
		} catch {
			return uri;
		}
	}

	_resolveMessage(result, rule) {
		return (
			result?.message?.text ||
			result?.message?.markdown ||
			rule?.shortDescription?.text ||
			"SARIF issue"
		);
	}

	_mapSeverity(level) {
		switch (String(level || "warning").toLowerCase()) {
			case "error":
				return "error";
			case "warning":
				return "warning";
			case "note":
			case "none":
				return "info";
			default:
				return "warning";
		}
	}
}
