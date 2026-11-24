import assert from "node:assert/strict";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const { run } = await import(
	process.env.ACTION_ENTRYPOINT
		? pathToFileURL(process.env.ACTION_ENTRYPOINT).href
		: "./index.js"
);

function fixture(listings) {
	const delays = [];
	const messages = [];
	let calls = 0;
	return {
		delays,
		messages,
		get calls() {
			return calls;
		},
		options: {
			core: { info: (message) => messages.push(message) },
			sleep: async (delay) => {
				delays.push(delay);
			},
			client: {
				async listArtifacts() {
					const result = listings[Math.min(calls++, listings.length - 1)];
					if (result instanceof Error) throw result;
					return { artifacts: result.map((id) => ({ id })) };
				},
			},
		},
	};
}

test("available IDs return immediately, including large IDs and duplicates", async () => {
	const state = fixture([[14921703962, 42]]);
	await run({ ...state.options, artifactIds: "14921703962, 42,42" });
	assert.deepEqual(state.delays, []);
	assert.match(
		state.messages.at(-1),
		/Artifacts are available: 14921703962, 42/,
	);
});

test("waits for every requested ID, ignoring unrelated and partially visible artifacts", async () => {
	const state = fixture([[99], [99, 42], [99, 42, 43]]);
	await run({ ...state.options, artifactIds: "42,43" });
	assert.deepEqual(state.delays, [1000, 2000]);
	assert.match(state.messages[1], /for artifacts: 43$/);
	assert.match(state.messages.at(-1), /Artifacts are available: 42, 43/);
});

test("permanently missing IDs fail after bounded backoff and identify the missing IDs", async () => {
	const state = fixture([[42]]);
	await assert.rejects(
		run({ ...state.options, artifactIds: "42,43" }),
		/Artifacts did not become available: 43$/,
	);
	assert.deepEqual(state.delays, [1000, 2000, 4000, 8000, 16000, 30000]);
	assert.equal(state.calls, 7);
});

test("service errors propagate without retrying discovery", async () => {
	const error = new Error("Permission denied");
	const state = fixture([error]);
	await assert.rejects(
		run({ ...state.options, artifactIds: "42" }),
		(actual) => actual === error,
	);
	assert.deepEqual(state.delays, []);
});

test("invalid IDs fail before requesting artifacts", async () => {
	for (const artifactIds of [
		undefined,
		"",
		"42,",
		"0",
		"-1",
		"1.5",
		"1e2",
		"9007199254740992",
		"42,nope",
	]) {
		const state = fixture([[42]]);
		await assert.rejects(
			run({ ...state.options, artifactIds }),
			/artifact-ids must contain/,
		);
		assert.equal(state.calls, 0);
	}
});
