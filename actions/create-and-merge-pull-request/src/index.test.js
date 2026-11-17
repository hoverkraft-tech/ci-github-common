import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { run } from "./index.js";

const headSha = "a".repeat(40);
const mergedSha = "b".repeat(40);

function scenario({ env = {}, mergeResult, pullRequest } = {}) {
	let merged = false;
	const outputs = {};
	const get = mock.fn(async () => ({
		data: {
			mergeable: true,
			head: { sha: headSha },
			merged,
			base: { ref: "main" },
			merge_commit_sha: merged ? mergedSha : null,
			...pullRequest,
		},
	}));
	const getExecOutput = mock.fn(async () => {
		if (mergeResult) return mergeResult;
		merged = true;
		return { exitCode: 0, stdout: "Merged", stderr: "" };
	});
	const parameters = {
		github: { rest: { pulls: { get } } },
		context: { repo: { owner: "example", repo: "repository" } },
		core: {
			debug: mock.fn(),
			setOutput: (key, value) => {
				outputs[key] = value;
			},
		},
		exec: { getExecOutput },
		sleep: mock.fn(async () => {}),
		env: { PULL_REQUEST_NUMBER: "123", PULL_REQUEST_HEAD_SHA: headSha, ...env },
	};
	return { parameters, outputs, get, getExecOutput };
}

test("disabling bypass uses a normal merge and returns the verified merge outputs", async () => {
	const setup = scenario({ env: { BYPASS_BRANCH_PROTECTION: "false" } });
	await run(setup.parameters);
	const [command, args] = setup.getExecOutput.mock.calls[0].arguments;
	assert.equal(command, "gh");
	assert.deepEqual(args, [
		"pr",
		"merge",
		"-R",
		"example/repository",
		"--rebase",
		"--match-head-commit",
		headSha,
		"123",
	]);
	assert.deepEqual(setup.outputs, {
		"merged-ref": "refs/heads/main",
		"merged-sha": mergedSha,
	});
});

test("branch protection failures never escalate to administrator merge", async () => {
	const setup = scenario({ env: { BYPASS_BRANCH_PROTECTION: "false" } });
	setup.getExecOutput.mock.mockImplementation(async (_command, args) => {
		if (args.includes("--admin"))
			return { exitCode: 0, stdout: "Bypassed protection", stderr: "" };
		return { exitCode: 1, stdout: "", stderr: "Required reviews are missing" };
	});
	await assert.rejects(run(setup.parameters), /Required reviews are missing/);
	assert.equal(setup.getExecOutput.mock.callCount(), 1);
	assert.deepEqual(setup.outputs, {});
});

for (const bypass of [undefined, "true"]) {
	test(`preserves administrator merge with ${bypass === undefined ? "the default" : "explicit bypass"} and checks the expected head`, async () => {
		const setup = scenario({ env: { BYPASS_BRANCH_PROTECTION: bypass } });
		await run(setup.parameters);
		const args = setup.getExecOutput.mock.calls[0].arguments[1];
		assert.ok(args.includes("--admin"));
		assert.equal(args[args.indexOf("--match-head-commit") + 1], headSha);
	});
}

test("refuses a head change before invoking the merge command", async () => {
	const setup = scenario({ pullRequest: { head: { sha: "c".repeat(40) } } });
	await assert.rejects(run(setup.parameters), /head changed/);
	assert.equal(setup.getExecOutput.mock.callCount(), 0);
	assert.deepEqual(setup.outputs, {});
});

test("a head change during the merge command fails without retrying", async () => {
	const setup = scenario();
	setup.getExecOutput.mock.mockImplementation(async (_command, args) => {
		assert.equal(args[args.indexOf("--match-head-commit") + 1], headSha);
		return { exitCode: 1, stdout: "", stderr: "Head commit does not match" };
	});
	await assert.rejects(run(setup.parameters), /Head commit does not match/);
	assert.equal(setup.getExecOutput.mock.callCount(), 1);
	assert.deepEqual(setup.outputs, {});
});

for (const [env, error] of [
	[{ BYPASS_BRANCH_PROTECTION: "yes" }, /bypass-branch-protection/],
	[{ PULL_REQUEST_HEAD_SHA: "" }, /head SHA/],
	[{ PULL_REQUEST_HEAD_SHA: "not-a-commit" }, /head SHA/],
	[{ PULL_REQUEST_NUMBER: "--admin" }, /pull request number/],
	[{ MERGE_METHOD: "unsupported" }, /Invalid merge method/],
]) {
	test(`invalid merge input is rejected: ${JSON.stringify(env)}`, async () => {
		const setup = scenario({ env });
		await assert.rejects(run(setup.parameters), error);
		assert.equal(setup.get.mock.callCount(), 0);
		assert.equal(setup.getExecOutput.mock.callCount(), 0);
	});
}

for (const method of ["merge", "squash"]) {
	test(`${method} preserves the supplied title and multiline message as arguments`, async () => {
		const title = "docs: update references";
		const body = "Generated files\n\nLiteral $(not-a-shell-command)";
		const setup = scenario({
			env: {
				MERGE_METHOD: method,
				PULL_REQUEST_TITLE: title,
				PULL_REQUEST_COMMIT_MESSAGE: body,
			},
		});
		await run(setup.parameters);
		const args = setup.getExecOutput.mock.calls[0].arguments[1];
		assert.ok(args.includes(`--${method}`));
		assert.equal(args[args.indexOf("--subject") + 1], title);
		assert.equal(args[args.indexOf("--body") + 1], body);
	});
}

test("waits for mergeability without changing the expected head", async () => {
	const setup = scenario();
	setup.get.mock.mockImplementationOnce(async () => ({
		data: { mergeable: null, head: { sha: headSha } },
	}));
	await run(setup.parameters);
	assert.deepEqual(
		setup.parameters.sleep.mock.calls.map((call) => call.arguments[0]),
		[1000],
	);
	assert.equal(setup.getExecOutput.mock.callCount(), 1);
});

test("retries a transient required-workflow error with the same merge guard", async () => {
	const setup = scenario({ env: { BYPASS_BRANCH_PROTECTION: "false" } });
	setup.getExecOutput.mock.mockImplementationOnce(async () => ({
		exitCode: 1,
		stdout: "",
		stderr: "Required workflow is pending",
	}));
	await run(setup.parameters);
	assert.equal(setup.getExecOutput.mock.callCount(), 2);
	for (const call of setup.getExecOutput.mock.calls) {
		const args = call.arguments[1];
		assert.equal(args[args.indexOf("--match-head-commit") + 1], headSha);
		assert.ok(!args.includes("--admin"));
	}
});

test("mergeability polling terminates without a merge when conflicts remain", async () => {
	const setup = scenario({ pullRequest: { mergeable: false } });
	await assert.rejects(
		run(setup.parameters),
		/not mergeable after 10 attempts/,
	);
	assert.equal(setup.get.mock.callCount(), 10);
	assert.equal(setup.getExecOutput.mock.callCount(), 0);
});

test("a successful command is not reported as a completed merge until GitHub confirms it", async () => {
	const setup = scenario({
		mergeResult: { exitCode: 0, stdout: "Queued", stderr: "" },
	});
	await assert.rejects(
		run(setup.parameters),
		/timed out.*merge verification|timed out.*verification/,
	);
	assert.deepEqual(setup.outputs, {});
});
