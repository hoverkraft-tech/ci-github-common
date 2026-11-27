import assert from "node:assert/strict";
import test from "node:test";
import { ReportRenderer } from "../../parse-ci-reports/src/formatters/CIReportFormatter.js";
import { Reporters } from "./Reporters.js";

function collection() {
	const check = {
		id: "check",
		check: {
			name: "Backend <script> @user",
			project: "backend",
			reports: [{ kind: "test" }],
			variant: { runtime: "PHP 8.3" },
		},
		source: { sha: "a".repeat(40), kind: "pr-head" },
		execution: { attempt: 1, job: { id: 1 } },
		job: { html_url: "https://github.com/owner/repo/actions/runs/1/job/1" },
		result: {
			outcome: "success",
			errors: [],
			assets: [
				{
					selector: { kind: "test" },
					data: {
						tests: [
							{
								name: "Refresh",
								suite: "Token",
								status: "failed",
								message: "Expected 200, got 401",
								file: "test.php",
							},
						],
						lintIssues: [],
					},
				},
			],
		},
	};
	return {
		identity: { runId: "42", attempt: 2, sha: "a".repeat(40) },
		jobs: { tests: { result: "success" }, docs: { result: "skipped" } },
		checks: [check],
		datasets: [],
		errors: [],
		reporters: Reporters.parse(),
	};
}

test("reporter selections distinguish omitted defaults from explicit disabling and reject unknown selections", () => {
	assert.deepEqual(Reporters.parse(), {
		test: ["annotations"],
		lint: ["annotations"],
		coverage: ["auto"],
	});
	assert.deepEqual(
		Reporters.parse({ coverage: " auto\ncodecov\nauto\n " }).coverage,
		["auto", "codecov"],
	);
	assert.deepEqual(Reporters.parse({ test: "", lint: "", coverage: "" }), {
		test: [],
		lint: [],
		coverage: [],
	});
	assert.throws(
		() => Reporters.parse({ coverage: "GitHub" }),
		/Unknown coverage reporter/,
	);
	assert.throws(
		() => Reporters.parse({ lint: "annotations,comment" }),
		/Unknown lint reporter/,
	);
});

test("native test failures remain fatal despite a successful command, with reporter publication disabled", () => {
	const model = collection();
	model.reporters = Reporters.parse({ test: "", lint: "", coverage: "" });
	assert.match(Reporters.complete(model, []).join(" "), /failing tests/);
	model.checks[0].result.errors.push("Missing required coverage");
	assert.match(
		Reporters.complete(model, []).join(" "),
		/Missing required coverage/,
	);
});

test("selected destinations require exactly one matching receipt, and native submission is insufficient", () => {
	const model = collection();
	model.checks[0].result.assets[0].data.tests[0].status = "passed";
	assert.match(
		Reporters.complete(model, []).join(" "),
		/expected one publication receipt/,
	);
	const subject = Reporters.subject(model, "test");
	const receipt = Reporters.receipt({
		dataset: subject,
		reporter: "annotations",
		status: "published",
	});
	assert.deepEqual(Reporters.complete(model, [receipt]), []);
	assert.match(
		Reporters.complete(model, [receipt, receipt]).join(" "),
		/received 2/,
	);
	receipt.digest = "wrong";
	assert.match(Reporters.complete(model, [receipt]).join(" "), /received 0/);
});

test("comment respects selections and report details are collapsed without hiding failure or source links", () => {
	const model = collection();
	const render = () =>
		new ReportRenderer({
			collection: model,
			errors: Reporters.complete(model, []),
			runUrl: "https://github.com/owner/repo/actions/runs/42",
			sourceUrl: "https://github.com/owner/repo/blob",
		});
	assert.equal(render().render({ comment: true }), "");
	model.reporters.test = ["comment"];
	const comment = render().render({ comment: true });
	assert.match(comment.split("<details>")[0], /CI checks failed/);
	assert.match(comment.split("<details>")[0], /failed test executions/);
	assert.match(
		comment,
		/<summary>Tests: 0 passed, 1 failed executions<\/summary>/,
	);
	assert.match(comment, /&lt;script&gt; &#64;user/);
	assert.doesNotMatch(
		comment,
		/<script>|@user|<details open|<summary>Lint|Report provenance/,
	);
	const summary = render().render();
	assert.match(summary, /Attempt 1, job 1/);
	assert.match(summary, /docs.*skipped/);
	assert.match(summary, /Read|Full Actions report/);
	assert.equal(
		(summary.match(/<details>/g) || []).length,
		(summary.match(/<\/details>/g) || []).length,
	);
});
