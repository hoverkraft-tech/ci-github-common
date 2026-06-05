import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SarifParser } from "./SarifParser.js";

const SAMPLE_SARIF = JSON.stringify({
	version: "2.1.0",
	runs: [
		{
			tool: {
				driver: {
					name: "CodeQL",
					rules: [
						{
							id: "js/missing-await",
							shortDescription: { text: "Missing await" },
							defaultConfiguration: { level: "warning" },
						},
					],
				},
			},
			results: [
				{
					ruleId: "js/missing-await",
					message: { text: "Promise returned from call is not awaited." },
					locations: [
						{
							physicalLocation: {
								artifactLocation: { uri: "src/app.js" },
								region: { startLine: 12, startColumn: 5 },
							},
						},
					],
				},
				{
					ruleId: "js/unsafe-eval",
					level: "error",
					message: { text: "Untrusted data is passed to eval." },
					locations: [
						{
							physicalLocation: {
								artifactLocation: {
									uri: "file:///workspace/src/index.js",
								},
								region: { startLine: 3, startColumn: 1 },
							},
						},
					],
				},
			],
		},
	],
});

describe("SarifParser", () => {
	it("keeps auto-pattern path detection synchronized", () => {
		const parser = new SarifParser();
		const filePath = "reports/humanize-sarif-report.json";

		assert.ok(parser.matchesAutoPatterns(filePath));
		assert.ok(parser.canParse(filePath, SAMPLE_SARIF));
	});

	it("identifies SARIF reports", () => {
		const parser = new SarifParser();

		assert.ok(parser.canParse("results.sarif", SAMPLE_SARIF));
		assert.ok(parser.canParse("reports/analysis.sarif.json", SAMPLE_SARIF));
		assert.ok(!parser.canParse("eslint.json", "[]"));
	});

	it("parses SARIF results into lint issues", () => {
		const parser = new SarifParser();

		const reportData = parser.parse(SAMPLE_SARIF, "results.sarif");
		assert.strictEqual(reportData.lintIssues.length, 2);

		const [warningIssue, errorIssue] = reportData.lintIssues;

		assert.strictEqual(warningIssue.file, "src/app.js");
		assert.strictEqual(warningIssue.line, 12);
		assert.strictEqual(warningIssue.column, 5);
		assert.strictEqual(warningIssue.severity, "warning");
		assert.strictEqual(warningIssue.rule, "js/missing-await");
		assert.strictEqual(
			warningIssue.message,
			"Promise returned from call is not awaited.",
		);
		assert.strictEqual(warningIssue.source, "CodeQL");

		assert.strictEqual(errorIssue.file, "/workspace/src/index.js");
		assert.strictEqual(errorIssue.line, 3);
		assert.strictEqual(errorIssue.column, 1);
		assert.strictEqual(errorIssue.severity, "error");
		assert.strictEqual(errorIssue.rule, "js/unsafe-eval");
		assert.strictEqual(errorIssue.message, "Untrusted data is passed to eval.");
	});

	it("falls back to rule metadata when result level or message is omitted", () => {
		const parser = new SarifParser();
		const reportData = parser.parse(
			JSON.stringify({
				version: "2.1.0",
				runs: [
					{
						tool: {
							driver: {
								name: "Semgrep",
								rules: [
									{
										id: "security.rule",
										shortDescription: { text: "Fallback message" },
										defaultConfiguration: { level: "warning" },
									},
								],
							},
						},
						results: [
							{
								ruleIndex: 0,
								locations: [
									{
										physicalLocation: {
											artifactLocation: { uri: "src/feature.ts" },
											region: { startLine: 8 },
										},
									},
								],
							},
						],
					},
				],
			}),
			"report.sarif",
		);

		assert.strictEqual(reportData.lintIssues.length, 1);
		const [issue] = reportData.lintIssues;

		assert.strictEqual(issue.file, "src/feature.ts");
		assert.strictEqual(issue.line, 8);
		assert.strictEqual(issue.column, 0);
		assert.strictEqual(issue.severity, "warning");
		assert.strictEqual(issue.rule, "security.rule");
		assert.strictEqual(issue.message, "Fallback message");
		assert.strictEqual(issue.source, "Semgrep");
	});
});
