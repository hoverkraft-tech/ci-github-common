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
