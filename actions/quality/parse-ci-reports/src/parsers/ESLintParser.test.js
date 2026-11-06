import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ESLintParser } from "./ESLintParser.js";

const SAMPLE_ESLINT_JSON = JSON.stringify([
	{
		filePath: "src/app.js",
		messages: [
			{
				ruleId: "no-console",
				severity: 2,
				message: "Unexpected console statement.",
				line: 3,
				column: 1,
			},
		],
	},
]);

describe("ESLintParser", () => {
	it("keeps auto-pattern path detection synchronized", () => {
		const parser = new ESLintParser();
		const filePath = "reports/humanize-eslint-report.json";

		assert.ok(parser.matchesAutoPatterns(filePath));
		assert.ok(parser.canParse(filePath, SAMPLE_ESLINT_JSON));
	});

	it("identifies ESLint report format", () => {
		const parser = new ESLintParser();

		assert.ok(parser.canParse("eslint-report.json", SAMPLE_ESLINT_JSON));
		assert.ok(!parser.canParse("eslint-report.txt", SAMPLE_ESLINT_JSON));
		assert.ok(!parser.canParse("eslint-report.json", "{}"));
	});

	it("parses lint issues from ESLint JSON", () => {
		const parser = new ESLintParser();
		const reportData = parser.parse(SAMPLE_ESLINT_JSON, "eslint-report.json");

		assert.strictEqual(reportData.lintIssues.length, 1);
		const [issue] = reportData.lintIssues;

		assert.strictEqual(issue.file, "src/app.js");
		assert.strictEqual(issue.line, 3);
		assert.strictEqual(issue.column, 1);
		assert.strictEqual(issue.severity, "error");
		assert.strictEqual(issue.rule, "no-console");
		assert.strictEqual(issue.message, "Unexpected console statement.");
	});
});
