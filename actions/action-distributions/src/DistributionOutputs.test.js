import assert from "node:assert/strict";
import { test } from "node:test";
import { DistributionOptions } from "./DistributionOptions.js";
import { DistributionOutputs } from "./DistributionOutputs.js";

function fixture(outputDirectory, paths = []) {
	const reads = [];
	const tree = {
		truncated: false,
		tree: paths.map((path) => ({ path, type: "tree", mode: "040000" })),
	};
	const github = {
		rest: {
			git: {
				getTree: async (request) => {
					reads.push(request);
					return { data: tree };
				},
			},
		},
	};
	return {
		reads,
		tree,
		outputs: new DistributionOutputs(
			github,
			{ owner: "owner", repo: "repo" },
			new DistributionOptions({ outputDirectory }),
		),
	};
}

test("resolves nested workspace output globs from the trusted tree", async () => {
	// Arrange
	const { outputs, reads } = fixture("actions/**/dist", [
		"actions/group/b/dist",
		"actions/a/dist",
		"actions/.hidden/dist",
		"actions/a/node_modules/dependency/dist",
		"packages/unrelated/dist",
	]);
	// Act
	await outputs.resolve("trusted-base", ["."]);
	// Assert
	assert.deepEqual(reads, [
		{ owner: "owner", repo: "repo", tree_sha: "trusted-base", recursive: "1" },
	]);
	assert.deepEqual(outputs.paths("."), [
		"actions/a/dist",
		"actions/group/b/dist",
	]);
	assert(outputs.contains(".", "actions/a/dist/nested/chunk.js"));
	assert(!outputs.contains(".", "actions/new/dist/index.js"));
	assert(!outputs.contains(".", "actions/a/dist-other/index.js"));
	assert(!outputs.contains(".", "actions/a/action.yml"));
});

test("resolves star and question-mark patterns relative to each selected package", async () => {
	// Arrange
	const { outputs } = fixture("bundles/*/dist?", [
		"packages/a/bundles/web/dist1",
		"packages/a/bundles/web/nested/dist1",
		"packages/b/bundles/server/dist2",
		"packages/b/bundles/server/dist22",
	]);
	// Act
	await outputs.resolve("trusted-base", ["packages/a", "packages/b"]);
	// Assert
	assert.deepEqual(outputs.paths("packages/a"), [
		"packages/a/bundles/web/dist1",
	]);
	assert.deepEqual(outputs.paths("packages/b"), [
		"packages/b/bundles/server/dist2",
	]);
});

test("retains literal outputs without requiring existing tree entries or API reads", async () => {
	// Arrange
	const { outputs, reads } = fixture("dist\nlib/bundle");
	// Act
	await outputs.resolve(undefined, ["packages/a"]);
	// Assert
	assert.deepEqual(outputs.paths("packages/a"), [
		"packages/a/dist",
		"packages/a/lib/bundle",
	]);
	assert.deepEqual(reads, []);
});

test("mixes literal outputs and resolved patterns", async () => {
	// Arrange
	const { outputs } = fixture("dist\nactions/*/bundle", ["actions/a/bundle"]);
	// Act
	await outputs.resolve("trusted-base", ["."]);
	// Assert
	assert.deepEqual(outputs.paths("."), ["actions/a/bundle", "dist"]);
});

test("requires resolution before authorizing a pattern", () => {
	// Arrange
	const { outputs } = fixture("actions/**/dist");
	// Act / Assert
	assert.throws(
		() => outputs.contains(".", "actions/new/dist/index.js"),
		/resolved/,
	);
});

for (const pattern of ["actions/*/dist", "dist\nactions/missing*/dist"]) {
	test(`rejects an unmatched output pattern ${pattern}`, async () => {
		// Arrange
		const { outputs } = fixture(pattern, ["dist"]);
		// Act / Assert
		await assert.rejects(
			outputs.resolve("trusted-base", ["."]),
			/matched no directories/,
		);
	});
}

test("rejects incomplete output discovery", async () => {
	// Arrange
	const { outputs, tree } = fixture("actions/**/dist", ["actions/a/dist"]);
	tree.truncated = true;
	// Act / Assert
	await assert.rejects(outputs.resolve("trusted-base", ["."]), /truncated/);
});

for (const entry of [
	{ type: "blob", mode: "120000" },
	{ type: "commit", mode: "160000" },
	{ type: "tree", mode: "100644" },
]) {
	test(`rejects unsupported matched directory mode ${entry.mode}`, async () => {
		// Arrange
		const { outputs, tree } = fixture("actions/**/dist", ["actions/a/dist"]);
		Object.assign(tree.tree[0], entry);
		// Act / Assert
		await assert.rejects(outputs.resolve("trusted-base", ["."]));
	});
}

for (const pattern of [
	"actions/*/dist\nactions/a/dist",
	"actions/a*/dist\nactions/*/dist/chunks",
	"actions/**",
]) {
	test(`rejects overlapping resolved outputs ${pattern}`, async () => {
		// Arrange
		const { outputs } = fixture(pattern, [
			"actions/a/dist",
			"actions/a/dist/chunks",
		]);
		// Act / Assert
		await assert.rejects(outputs.resolve("trusted-base", ["."]), /overlapping/);
	});
}

for (const pattern of [
	"../*",
	"/actions/*",
	"actions/**/../dist",
	"!actions/*",
	"actions/[ab]/dist",
	"actions/.hidden/*",
	"actions/**\\dist",
]) {
	test(`rejects unsafe or unsupported output pattern ${pattern}`, () => {
		// Arrange / Act / Assert
		assert.throws(() => fixture(pattern), /Invalid output directory/);
	});
}
