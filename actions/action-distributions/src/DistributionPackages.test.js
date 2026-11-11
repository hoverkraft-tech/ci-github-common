import assert from "node:assert/strict";
import { test } from "node:test";
import { DistributionOptions } from "./DistributionOptions.js";
import { DistributionPackages } from "./DistributionPackages.js";

function fixture(packages, options = {}) {
	const requests = [];
	const tree = {
		truncated: false,
		tree: Object.keys(packages).map((directory) => ({
			path: directory === "." ? "package.json" : `${directory}/package.json`,
			type: "blob",
			mode: "100644",
			sha: directory,
		})),
	};
	const github = {
		rest: {
			git: {
				getTree: async (input) => {
					requests.push(input);
					return { data: tree };
				},
				getBlob: async ({ file_sha }) => ({
					data: {
						encoding: "base64",
						content: Buffer.from(JSON.stringify(packages[file_sha])).toString(
							"base64",
						),
					},
				}),
			},
		},
	};
	return {
		tree,
		requests,
		packages: new DistributionPackages(
			github,
			{ owner: "owner", repo: "repo" },
			new DistributionOptions(options),
		),
	};
}
const bundled = { scripts: { build: "build", "check:dist": "check" } };

test("discovers nested action packages, excludes installed/generated manifests and non-bundled packages", async () => {
	const { packages, requests } = fixture({
		"actions/z": bundled,
		"actions/group/a": bundled,
		"actions/group/a/node_modules/dependency": bundled,
		"actions/group/a/dist/dependency": bundled,
		"actions/.hidden": bundled,
		"tests/fixture": bundled,
		".": { scripts: { build: "build" } },
		"actions/plain": { scripts: { test: "test" } },
	});
	assert.deepEqual(await packages.discover("revision"), [
		"actions/group/a",
		"actions/z",
	]);
	assert.equal(requests[0].tree_sha, "revision");
});

test("discovers a standalone root action", async () => {
	assert.deepEqual(
		await fixture({ ".": bundled }).packages.discover("revision"),
		["."],
	);
});

test("excludes manifests inside explicitly configured workspace outputs", async () => {
	// Arrange
	const { packages } = fixture(
		{
			".": bundled,
			"actions/a/dist": bundled,
			"actions/b/dist/nested": bundled,
		},
		{ outputDirectory: "actions/a/dist\nactions/b/dist" },
	);
	// Act
	const directories = await packages.discover("revision");
	// Assert
	assert.deepEqual(directories, ["."]);
});

test("glob overrides select custom directories without duplicate matches", async () => {
	const { packages } = fixture(
		{ "custom/a": bundled, "custom/b": bundled, "actions/other": bundled },
		{ workingDirectories: "custom/*\ncustom/a" },
	);
	assert.deepEqual(await packages.discover("revision"), [
		"custom/a",
		"custom/b",
	]);
});

test("explicit directories retain their allowlist without reading repository manifests", async () => {
	const { packages, requests } = fixture(
		{},
		{ workingDirectories: "custom/a" },
	);
	assert.deepEqual(await packages.discover("revision"), ["custom/a"]);
	assert.deepEqual(requests, []);
});

test("no eligible packages yields an empty matrix", async () => {
	assert.deepEqual(
		await fixture({
			"actions/a": { scripts: { build: "" } },
		}).packages.discover("revision"),
		[],
	);
});

test("discovery honors a configured build script", async () => {
	const { packages } = fixture(
		{ "actions/a": { scripts: { bundle: "bundle", "check:dist": "check" } } },
		{ buildScript: "bundle" },
	);
	assert.deepEqual(await packages.discover("revision"), ["actions/a"]);
});

test("rejects truncated trees, manifest symlinks and overlapping output scopes", async () => {
	const { packages, tree } = fixture({ "actions/a": bundled });
	tree.truncated = true;
	await assert.rejects(packages.discover("revision"), /truncated/);
	tree.truncated = false;
	tree.tree[0].mode = "120000";
	await assert.rejects(packages.discover("revision"), /regular package/);
	await assert.rejects(
		fixture({ ".": bundled, "actions/a": bundled }).packages.discover(
			"revision",
		),
		/Overlapping/,
	);
});

for (const pattern of [
	"../*",
	"/actions/*",
	"actions/**/../*",
	"actions/.hidden/*",
	"actions/**\\bad",
	"!actions/*",
]) {
	test(`rejects unsafe directory pattern ${pattern}`, () => {
		assert.throws(
			() => new DistributionOptions({ workingDirectories: pattern }),
			/Invalid working directory/,
		);
	});
}
