import assert from "node:assert/strict";
import test from "node:test";
import { ExecutionIdentity } from "./ExecutionIdentity.js";

const job = {
	id: 1,
	name: "Custom display name",
	runner_id: 7,
	runner_name: "runner-a",
	started_at: "2026-11-27T12:00:00Z",
	status: "completed",
};
function resolver(attempts, attempt = 2) {
	return new ExecutionIdentity({
		attempt,
		runnerName: "runner-a",
		sleep: async () => {},
		context: {
			repo: { owner: "owner", repo: "project" },
			runId: 42,
			payload: { repository: { id: 1 } },
		},
		github: {
			rest: { actions: { listJobsForWorkflowRunAttempt() {} } },
			paginate: async (_method, options) => attempts[options.attempt_number],
		},
	});
}
function registration(original = job, id = "recording") {
	return { id, execution: { attempt: 1, job: original } };
}

test("partial and collector-only reruns reuse actual executions despite copied job IDs", async () => {
	const latest = { ...job, id: 100 };
	const result = await resolver({ 1: [job], 2: [latest] }).select([
		registration(),
		registration(job, "second-check"),
	]);
	assert.equal(result.selected.length, 2);
	assert.deepEqual(result.errors, []);
	assert.equal(result.selected[0].job.id, 100);
	assert.equal(result.selected[0].registration.execution.job.id, 1);
});

test("an actually rerun producer cannot reuse earlier evidence, including sequential self-hosted runner reuse", async () => {
	const rerun = { ...job, id: 100, started_at: "2026-11-27T12:10:00Z" };
	const result = await resolver({ 1: [job], 2: [rerun] }).select([
		registration(),
	]);
	assert.equal(result.selected.length, 0);
	assert.match(result.errors[0], /changed without a new registration/);
});

test("duplicate display names are resolved by actual execution and ambiguous matches fail", async () => {
	const other = { ...job, id: 2, runner_id: 8, runner_name: "runner-b" };
	const result = await resolver({
		1: [job, other],
		2: [
			{ ...job, id: 100 },
			{ ...other, id: 200 },
		],
	}).select([registration(), registration(other, "other")]);
	assert.equal(result.selected.length, 2);
	await assert.rejects(
		resolver({
			1: [job],
			2: [
				{ ...job, id: 100 },
				{ ...job, id: 200 },
			],
		}).select([registration()]),
		/Ambiguous/,
	);
});

test("preparation binds only the unique active runner and collection refuses active producers", async () => {
	const active = { ...job, status: "in_progress" };
	const execution = await resolver({ 1: [active] }, 1).current();
	assert.equal(execution.job.id, 1);
	await assert.rejects(
		resolver({ 1: [active, { ...active, id: 2 }] }, 1).current(),
		/Ambiguous/,
	);
	await assert.rejects(
		resolver({ 1: [job], 2: [active] }).select([registration()]),
		/still active/,
	);
});
