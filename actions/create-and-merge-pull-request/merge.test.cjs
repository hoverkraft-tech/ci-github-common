const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");

const action = JSON.parse(
	execFileSync("ruby", [
		"-rjson",
		"-ryaml",
		"-e",
		"puts JSON.generate(YAML.safe_load(File.read(ARGV[0])))",
		path.join(__dirname, "action.yml"),
	]),
);
const script = action.runs.steps.find(
	(step) => step.id === "merge-pull-request",
).with.script;
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const merge = new AsyncFunction(
	"github",
	"core",
	"exec",
	"context",
	"process",
	"setTimeout",
	script,
);
const open = { mergeable: true, merged: false, base: { ref: "main" } };
const merged = { ...open, merged: true, merge_commit_sha: "merged-commit" };
const queue = { isMergeQueueEnabled: true, merged: false };

function harness({
	pulls = [open, merged],
	queueStates = [{ isMergeQueueEnabled: false }],
	commands = [{ exitCode: 0, stdout: "", stderr: "" }],
	env = {},
} = {}) {
	const outputs = {};
	const calls = [];
	const delays = [];
	const counters = { pulls: 0, queue: 0, commands: 0 };
	const next = (values, key) =>
		values[Math.min(counters[key]++, values.length - 1)];
	return {
		outputs,
		calls,
		delays,
		counters,
		run: () =>
			merge(
				{
					rest: {
						pulls: { get: async () => ({ data: next(pulls, "pulls") }) },
					},
					graphql: async (_query, variables) => {
						assert.deepEqual(variables, {
							owner: "org",
							repo: "repo",
							number: 42,
						});
						return { repository: { pullRequest: next(queueStates, "queue") } };
					},
				},
				{
					debug: () => {},
					notice: () => {},
					setOutput: (name, value) => {
						outputs[name] = value;
					},
				},
				{
					getExecOutput: async (command, args) => {
						calls.push({ command, args });
						return next(commands, "commands");
					},
				},
				{ repo: { owner: "org", repo: "repo" } },
				{
					env: {
						PULL_REQUEST_NUMBER: "42",
						MERGE_METHOD: "squash",
						PULL_REQUEST_TITLE: "docs: update documentation",
						PULL_REQUEST_COMMIT_MESSAGE: "Generated documentation\n\n[skip ci]",
						...env,
					},
				},
				(resolve, delay) => {
					delays.push(delay);
					resolve();
				},
			),
	};
}

for (const method of ["merge", "rebase", "squash"]) {
	test(`direct ${method} merge reports the verified commit`, async () => {
		const scenario = harness({ env: { MERGE_METHOD: method } });
		await scenario.run();
		assert.ok(scenario.calls[0].args.includes(`--${method}`));
		assert.ok(scenario.calls[0].args.includes("--admin"));
		assert.equal(
			scenario.calls[0].args.includes("--subject"),
			method !== "rebase",
		);
		assert.deepEqual(scenario.outputs, {
			"merged-ref": "refs/heads/main",
			"merged-sha": "merged-commit",
			"merge-pending": "false",
		});
	});
}

for (const pending of [
	{ autoMergeRequest: { enabledAt: "2026-01-01T00:00:00Z" } },
	{ mergeQueueEntry: { id: "queue-entry" } },
]) {
	test(`accepts confirmed ${Object.keys(pending)[0]} without claiming a merge`, async () => {
		const scenario = harness({
			queueStates: [queue, { ...queue, ...pending }],
		});
		await scenario.run();
		assert.deepEqual(scenario.calls, [
			{
				command: "gh",
				args: ["pr", "merge", "-R", "org/repo", "--auto", "42"],
			},
		]);
		assert.deepEqual(scenario.outputs, { "merge-pending": "true" });
		assert.equal(scenario.counters.pulls, 1);
	});
}

test("waits for GitHub to confirm queue acceptance", async () => {
	const scenario = harness({
		queueStates: [queue, queue, { ...queue, mergeQueueEntry: { id: "entry" } }],
	});
	await scenario.run();
	assert.deepEqual(scenario.delays, [1000]);
	assert.equal(scenario.outputs["merge-pending"], "true");
});

test("reports a completed queue merge only after REST verification", async () => {
	const scenario = harness({
		queueStates: [queue, { ...queue, merged: true }],
		pulls: [open, open, merged],
	});
	await scenario.run();
	assert.equal(scenario.outputs["merged-sha"], "merged-commit");
	assert.equal(scenario.outputs["merge-pending"], "false");
	assert.deepEqual(scenario.delays, [1000]);
});

test("does not treat an unconfirmed merge request as success", async () => {
	const scenario = harness({ queueStates: [queue] });
	await assert.rejects(
		scenario.run(),
		/did not confirm auto-merge or queue entry/,
	);
	assert.deepEqual(scenario.outputs, {});
	assert.equal(scenario.counters.queue, 11);
});

test("fails immediately when requesting auto-merge is denied", async () => {
	const scenario = harness({
		queueStates: [queue],
		commands: [
			{ exitCode: 1, stderr: "Resource not accessible by integration" },
		],
	});
	await assert.rejects(
		scenario.run(),
		/Resource not accessible by integration/,
	);
	assert.equal(scenario.calls.length, 1);
	assert.deepEqual(scenario.outputs, {});
});

test("retries required-workflow propagation failures", async () => {
	const scenario = harness({
		commands: [
			{ exitCode: 1, stderr: "Required workflow has not been evaluated" },
			{ exitCode: 0 },
		],
	});
	await scenario.run();
	assert.equal(scenario.calls.length, 2);
	assert.deepEqual(scenario.delays, [1000]);
});

test("does not enqueue a pull request with merge conflicts", async () => {
	const scenario = harness({ pulls: [{ ...open, mergeable: false }] });
	await assert.rejects(scenario.run(), /not mergeable after 10 attempts/);
	assert.deepEqual(scenario.calls, []);
});

for (const env of [
	{ MERGE_METHOD: "unsupported" },
	{ PULL_REQUEST_NUMBER: "42; command" },
]) {
	test(`rejects invalid ${Object.keys(env)[0]} before calling GitHub`, async () => {
		const scenario = harness({ env });
		await assert.rejects(scenario.run(), /Invalid/);
		assert.equal(scenario.counters.pulls, 0);
		assert.deepEqual(scenario.calls, []);
	});
}
