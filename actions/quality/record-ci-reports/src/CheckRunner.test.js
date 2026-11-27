import assert from "node:assert/strict";
import test from "node:test";
import { CheckRunner } from "./CheckRunner.js";
import { Protocol } from "./Protocol.js";

test("ordinary command failure finalizes native diagnostics with its original exit code", async () => {
	const calls = [];
	const recording = {
		workspace: "/workspace",
		prepare: async (definition) => {
			calls.push(["prepare", definition]);
			return { recording: "handle", "report-directory": "/fresh" };
		},
		finalize: async (input) => {
			calls.push(["finalize", input]);
			return input;
		},
	};
	const runner = new CheckRunner({
		recording,
		execute: async (_command, options) => {
			calls.push(["execute", options]);
			return { code: 17, signal: null };
		},
	});
	const result = await runner.run({
		command: "npm test",
		project: "frontend",
		testResults: "junit.xml",
	});
	assert.equal(result.exitCode, 17);
	assert.equal(result.outcome, "failure");
	assert.equal(calls[1][1].env.CI_REPORTS_DIR, "/fresh");
	assert.equal(calls[1][1].cwd, "/workspace/frontend");
	assert.equal(calls[0][0], "prepare");
	assert.equal(calls[2][0], "finalize");
});

test("provider shard contracts reject incomplete or duplicate merges before execution", () => {
	const definition = (shards) => ({
		reports: [{ kind: "coverage", pattern: "lcov.info", shards }],
	});
	assert.throws(
		() =>
			Protocol.definition(
				definition({ expected: ["1", "2"], included: ["1"] }),
			),
		/missing promised/,
	);
	assert.throws(
		() =>
			Protocol.definition(
				definition({ expected: ["1"], included: ["1", "1"] }),
			),
		/unique/,
	);
	assert.doesNotThrow(() =>
		Protocol.definition(
			definition({ expected: ["1", "2"], included: ["2", "1"] }),
		),
	);
});
