import assert from "node:assert/strict";
import { test } from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { run } = await import(
	process.env.ACTION_ENTRYPOINT
		? pathToFileURL(process.env.ACTION_ENTRYPOINT).href
		: "./index.js"
);
const missing = () =>
	Object.assign(new Error("Artifact not found"), {
		name: "ArtifactNotFoundError",
	});
const artifact = (id) => ({
	id,
	name: `artifact-${id}`,
	digest: `digest-${id}`,
});

function fixture(listings, downloads = {}) {
	const delays = [];
	const outputs = {};
	const received = [];
	let calls = 0;
	return {
		delays,
		outputs,
		received,
		get calls() {
			return calls;
		},
		options: {
			destination: "/artifacts",
			core: {
				info() {},
				setOutput: (name, value) => {
					outputs[name] = value;
				},
			},
			sleep: async (delay) => {
				delays.push(delay);
			},
			client: {
				async listArtifacts(options) {
					const result = listings[Math.min(calls++, listings.length - 1)];
					if (result instanceof Error) throw result;
					received.push({ operation: "list", options });
					return {
						artifacts: result.map((value) =>
							typeof value === "number" ? artifact(value) : value,
						),
					};
				},
				async downloadArtifact(id, options) {
					received.push({ operation: "download", id, options });
					const result = downloads[id]?.shift() || {};
					if (result instanceof Error) throw result;
					return result;
				},
			},
		},
	};
}

test("downloads large and duplicate IDs once, preserving digest checks and separate paths", async () => {
	const state = fixture([[14921703962, 42, 99]]);
	await run({ ...state.options, artifactIds: "14921703962, 42,42" });
	assert.deepEqual(state.delays, []);
	assert.deepEqual(
		state.received.filter(({ operation }) => operation === "download"),
		[14921703962, 42].map((id) => ({
			operation: "download",
			id,
			options: {
				path: path.resolve(`/artifacts/artifact-${id}`),
				expectedHash: `digest-${id}`,
				skipDecompress: false,
			},
		})),
	);
	assert.equal(state.outputs["download-path"], path.resolve("/artifacts"));
});

test("retries missing metadata and disappearing downloads without repeating completed IDs", async () => {
	const state = fixture([[99], [42, 43], [43], [43]], {
		43: [missing(), missing(), {}],
	});
	await run({ ...state.options, artifactIds: "42,43", mergeMultiple: "true" });
	assert.deepEqual(state.delays, [1000, 2000, 4000]);
	const downloads = state.received.filter(
		({ operation }) => operation === "download",
	);
	assert.deepEqual(
		downloads.map(({ id }) => id),
		[42, 43, 43, 43],
	);
	assert.ok(
		downloads.every(
			({ options }) => options.path === path.resolve("/artifacts"),
		),
	);
});

test("REST downloads retry 404 and preserve token scope, raw archives and single-artifact paths", async () => {
	const state = fixture([[42]], {
		42: [Object.assign(new Error("Not Found"), { status: 404 }), {}],
	});
	await run({
		...state.options,
		artifactIds: "42",
		skipDecompress: "true",
		githubToken: "test-token",
		repository: "owner/repo",
		runId: "123",
	});
	assert.deepEqual(state.delays, [1000]);
	for (const { operation, options } of state.received) {
		assert.deepEqual(options.findBy, {
			token: "test-token",
			repositoryOwner: "owner",
			repositoryName: "repo",
			workflowRunId: 123,
		});
		if (operation === "download") {
			assert.equal(options.skipDecompress, true);
			assert.equal(options.path, path.resolve("/artifacts"));
		}
	}
});

test("missing metadata or downloads exhaust bounded retries without publishing success", async () => {
	for (const state of [
		fixture([[42]]),
		fixture([[42, 43]], { 43: Array.from({ length: 7 }, missing) }),
	]) {
		await assert.rejects(
			run({ ...state.options, artifactIds: "42,43" }),
			/Artifacts could not be downloaded: 43$/,
		);
		assert.deepEqual(state.delays, [1000, 2000, 4000, 8000, 16000, 30000]);
		assert.equal(state.calls, 7);
		assert.deepEqual(state.outputs, {});
	}
});

test("service, permission, extraction and digest failures remain failures without retries", async () => {
	const denied = Object.assign(new Error("Permission denied"), { status: 403 });
	const states = [
		fixture([denied]),
		fixture([[42]], { 42: [denied] }),
		fixture([[42]], { 42: [new Error("Unable to extract artifact")] }),
		fixture([[42]], { 42: [{ digestMismatch: true }] }),
	];
	for (const state of states) {
		await assert.rejects(run({ ...state.options, artifactIds: "42" }));
		assert.deepEqual(state.delays, []);
		assert.deepEqual(state.outputs, {});
	}
});

test("invalid inputs fail before requesting artifacts", async () => {
	const invalid = [
		undefined,
		"",
		"42,",
		"0",
		"-1",
		"1.5",
		"1e2",
		"9007199254740992",
		"42,nope",
	].map((artifactIds) => ({ artifactIds }));
	invalid.push(
		{ artifactIds: "42", mergeMultiple: "yes" },
		{ artifactIds: "42", skipDecompress: "yes" },
		{
			artifactIds: "42",
			githubToken: "test-token",
			repository: "invalid",
			runId: "123",
		},
		{
			artifactIds: "42",
			githubToken: "test-token",
			repository: "owner/repo",
			runId: "0",
		},
	);
	for (const options of invalid) {
		const state = fixture([[42]]);
		await assert.rejects(run({ ...state.options, ...options }));
		assert.equal(state.calls, 0);
	}
});

test("artifact names cannot escape the destination", async () => {
	for (const name of ["../escape", "..", "folder\\escape", ""]) {
		const state = fixture([[{ ...artifact(42), name }]]);
		await assert.rejects(
			run({ ...state.options, artifactIds: "42" }),
			/Invalid artifact name/,
		);
		assert.equal(
			state.received.filter(({ operation }) => operation === "download").length,
			0,
		);
	}
});
