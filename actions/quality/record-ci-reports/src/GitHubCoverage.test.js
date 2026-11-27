import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { GitHubCoverage } from "./GitHubCoverage.js";

const sha = "a".repeat(40);
const dataset = {
	id: "backend",
	source: { sha, kind: "pr-head" },
	digest: "digest",
	label: "backend/unit",
	language: "Python",
	errors: [],
};
function fixture(t, responses) {
	const directory = fs.mkdtempSync(
		path.join(os.tmpdir(), "native-coverage-test-"),
	);
	t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	const file = path.join(directory, "coverage.xml");
	fs.writeFileSync(file, "<coverage/>");
	const calls = [];
	let now = 0;
	const context = {
		repo: { owner: "owner", repo: "project" },
		eventName: "pull_request",
		sha,
		payload: {
			pull_request: {
				number: 1,
				head: { sha, repo: { full_name: "owner/project" } },
			},
		},
	};
	const github = {
		rest: {
			pulls: { get: async () => ({ data: { state: "open", head: { sha } } }) },
		},
		request: async (route, options) => {
			calls.push({ route, options });
			const value = responses.shift();
			if (value instanceof Error) throw value;
			return { data: value };
		},
	};
	return {
		context,
		github,
		calls,
		file,
		publisher: new GitHubCoverage({
			context,
			github,
			now: () => now,
			sleep: async (delay) => {
				now += delay;
			},
		}),
	};
}

test("native publication requires an acknowledged report ID and successful processing", async (t) => {
	const state = fixture(t, [
		[],
		{ id: "report-id" },
		{ processing_status: "processing" },
		{ processing_status: "succeeded" },
	]);
	const result = await state.publisher.publish({
		dataset,
		file: state.file,
		auto: true,
	});
	assert.equal(result.status, "published");
	assert.equal(result.id, "report-id");
	assert.equal(result.digest, dataset.digest);
	assert.equal(state.calls[1].options.commit_oid, sha);
});

test("only an explicit feature-disabled response permits automatic fallback", async (t) => {
	const disabled = Object.assign(new Error("disabled"), {
		status: 403,
		response: {
			data: {
				message:
					"Code quality is not enabled for this repository. Please enable code quality in the repository settings.",
			},
		},
	});
	const state = fixture(t, [disabled, disabled]);
	const automatic = await state.publisher.publish({
		dataset,
		file: state.file,
		auto: true,
	});
	assert.equal(automatic.status, "unavailable");
	assert.equal(automatic.fallback, "comment");
	const explicit = await state.publisher.publish({
		dataset,
		file: state.file,
		explicit: true,
	});
	assert.equal(explicit.status, "failed");
	assert.equal(explicit.fallback, undefined);
});

test("permission errors, accepted-without-ID responses and processing failures cannot become successful fallback", async (t) => {
	const scenarios = [
		[
			Object.assign(new Error("Resource not accessible by integration"), {
				status: 403,
			}),
		],
		[[], { message: "commit is no longer current" }],
		[
			[],
			{ id: "report-id" },
			{ processing_status: "failed", errors: ["invalid report"] },
		],
	];
	for (const responses of scenarios) {
		const state = fixture(t, responses);
		const result = await state.publisher.publish({
			dataset,
			file: state.file,
			auto: true,
		});
		assert.equal(result.status, "failed");
		assert.equal(result.fallback, undefined);
	}
});

test("merge-result measurements remain distinct from stale PR-head measurements", async (t) => {
	const state = fixture(t, []);
	const merged = await state.publisher.publish({
		dataset: { ...dataset, source: { sha: "b".repeat(40), kind: "pr-merge" } },
		file: state.file,
		auto: true,
	});
	assert.equal(merged.status, "unavailable");
	assert.equal(merged.fallback, "comment");
	state.github.rest.pulls.get = async () => ({
		data: { state: "open", head: { sha: "c".repeat(40) } },
	});
	const stale = await state.publisher.publish({
		dataset,
		file: state.file,
		auto: true,
	});
	assert.equal(stale.status, "superseded");
	assert.equal(state.calls.length, 0);
});
