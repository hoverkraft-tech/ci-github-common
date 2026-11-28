import assert from "node:assert/strict";
import test from "node:test";
import { ReportRenderer } from "./CIReportFormatter.js";

test("a failed native linter without structured findings stays visibly failed", () => {
	const check = {
		check: { name: "Super-Linter", reports: [{ kind: "lint", owner: "tool" }] },
		job: { html_url: "https://github.com/owner/repo/actions/runs/1" },
		result: { outcome: "failure", errors: [], assets: [] },
	};
	const renderer = new ReportRenderer({ collection: { checks: [check] } });
	assert.match(
		renderer.lint([]),
		/<summary>Lint: 1 check, 1 failed<\/summary>/,
	);
	assert.doesNotMatch(renderer.lint([]), /0 errors|passed/);
	delete check.result;
	assert.match(renderer.lint([]), /1 incomplete/);
});

test("Go coverage displays native statements without relabeling them as lines", () => {
	const renderer = new ReportRenderer({
		collection: {
			datasets: [
				{
					label: "api",
					errors: [],
					assets: [
						{
							data: {
								coverage: {
									metric: "statements",
									statements: { total: 4, covered: 3, percentage: 75 },
									lines: { total: 6, covered: 5, percentage: 83.333 },
								},
							},
						},
					],
				},
			],
		},
	});
	const markdown = renderer.coverage(true);
	assert.match(markdown, /75.0% statements \(3\/4\)/);
	assert.doesNotMatch(markdown, /83.3%|75.0% lines/);
});
