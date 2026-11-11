import assert from "node:assert/strict";
import { test } from "node:test";
import { DistributionCommit } from "./DistributionCommit.js";

function fixture(failure) {
	const calls = [];
	const record = (operation, result) => async (input) => {
		calls.push({ operation, input });
		if (operation === failure) throw new Error(operation);
		return { data: result };
	};
	const github = {
		rest: {
			git: {
				createBlob: record("blob", { sha: "blob" }),
				getCommit: record("parent", { tree: { sha: "parent-tree" } }),
				createTree: record("tree", { sha: "tree" }),
				createCommit: record("commit", { sha: "commit" }),
			},
		},
		graphql: async (_query, input) => {
			if (!input.input) return { repository: { id: "repository" } };
			await record("update", {})(input.input);
		},
	};
	const publisher = new DistributionCommit(github, {
		owner: "owner",
		repo: "repo",
	});
	const input = {
		branch: "dependabot/example",
		head: "expected-head",
		message: { headline: "build: bundles", body: "Generated-by: example" },
		fileChanges: {
			additions: [{ path: "actions/a/dist/index.js", contents: "YQ==" }],
			deletions: [{ path: "actions/a/dist/old.js" }],
		},
	};
	return { calls, publisher, input };
}

test("uploads blobs and preserves the parent tree before one atomic non-forced branch update", async () => {
	// Arrange
	const { calls, publisher, input } = fixture();
	// Act
	await publisher.create(input);
	// Assert
	assert.deepEqual(calls, [
		{
			operation: "blob",
			input: {
				owner: "owner",
				repo: "repo",
				content: "YQ==",
				encoding: "base64",
			},
		},
		{
			operation: "parent",
			input: { owner: "owner", repo: "repo", commit_sha: "expected-head" },
		},
		{
			operation: "tree",
			input: {
				owner: "owner",
				repo: "repo",
				base_tree: "parent-tree",
				tree: [
					{
						path: "actions/a/dist/index.js",
						mode: "100644",
						type: "blob",
						sha: "blob",
					},
					{
						path: "actions/a/dist/old.js",
						mode: "100644",
						type: "blob",
						sha: null,
					},
				],
			},
		},
		{
			operation: "commit",
			input: {
				owner: "owner",
				repo: "repo",
				message: "build: bundles\n\nGenerated-by: example",
				tree: "tree",
				parents: ["expected-head"],
			},
		},
		{
			operation: "update",
			input: {
				repositoryId: "repository",
				refUpdates: [
					{
						name: "refs/heads/dependabot/example",
						beforeOid: "expected-head",
						afterOid: "commit",
						force: false,
					},
				],
			},
		},
	]);
});

for (const failure of ["blob", "parent", "tree", "commit", "update"]) {
	test(`propagates ${failure} failure without retrying or publishing a partial tree`, async () => {
		// Arrange
		const { calls, publisher, input } = fixture(failure);
		// Act
		const result = publisher.create(input);
		// Assert
		await assert.rejects(result, new RegExp(failure));
		assert.equal(calls.at(-1).operation, failure);
		assert.equal(
			calls.filter((call) => call.operation === "update").length,
			failure === "update" ? 1 : 0,
		);
	});
}
