import assert from "node:assert/strict";
import test from "node:test";
import { Runtime } from "./Runtime.js";

test("completion always writes an actionable summary when retained evidence cannot be read", async () => {
	const messages = [];
	const failures = [];
	const core = {
		setFailed: (message) => failures.push(message),
		summary: {
			addRaw(message) {
				messages.push(message);
				return this;
			},
			async write() {},
		},
	};
	const runtime = new Runtime({
		core,
		github: {},
		context: {
			repo: { owner: "owner", repo: "repo" },
			serverUrl: "https://github.com",
			runId: 12,
			sha: "a".repeat(40),
		},
	});
	runtime.store.collection = async () => {
		throw new Error("Collection expired");
	};
	await runtime.internal("complete", { artifactId: "42" });
	assert.equal(messages.length, 1);
	assert.match(messages[0], /Collection expired/);
	assert.match(messages[0], /actions\/runs\/12/);
	assert.deepEqual(failures, ["Collection expired"]);
});
