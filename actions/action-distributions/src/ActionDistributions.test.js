import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const { ActionDistributions, GENERATED_BY } = await import(
	process.env.ACTION_ENTRYPOINT
		? pathToFileURL(process.env.ACTION_ENTRYPOINT)
		: new URL("./ActionDistributions.js", import.meta.url)
);

import { DistributionOptions } from "./DistributionOptions.js";

const PACKAGE = "actions/example";
const SHA = "a".repeat(40);
const TRUSTED_SHA = "c".repeat(40);
const BUILDER_PATH = ".github/workflows/__rebuild-action-distributions.yml";
const WRITER_PATH = ".github/workflows/__commit-action-distributions.yml";
const workflowFile = (path, text) => ({
	name: path.split("/").at(-1),
	mode: 0o100644,
	object: { text, isTruncated: false },
});
const BRANCH = "dependabot/npm/example";
const encode = (value) => Buffer.from(value).toString("base64");
const file = (name, contents = name) => ({
	path: `${PACKAGE}/dist/${name}`,
	contents: encode(contents),
});
const blob = (entry) => {
	const bytes = Buffer.from(entry.contents, "base64");
	return {
		path: entry.path,
		type: "blob",
		mode: "100644",
		sha: createHash("sha1")
			.update(`blob ${bytes.length}\0`)
			.update(bytes)
			.digest("hex"),
	};
};

function fixture(t, options = {}) {
	const temporary = fs.mkdtempSync(
		path.join(os.tmpdir(), "action-distributions-"),
	);
	t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
	const state = {
		message: "build(deps): update dependencies",
		pr: {
			number: 1,
			state: "open",
			user: { login: "dependabot[bot]", id: 49699333 },
			changed_files: 1,
			head: { sha: SHA, ref: BRANCH, repo: { full_name: "owner/repo" } },
			base: { ref: "main", repo: { full_name: "owner/repo" } },
		},
		writer: {
			id: 11,
			event: "workflow_run",
			head_sha: TRUSTED_SHA,
			path: WRITER_PATH,
		},
		definitions: [
			workflowFile(
				WRITER_PATH,
				"name: Writer\non:\n  workflow_run:\n    workflows: [Build]\n    types: [completed]",
			),
			workflowFile(BUILDER_PATH, "name: Build\non: pull_request"),
		],
		workflowReads: [],
		run: {
			path: BUILDER_PATH,
			id: 10,
			workflow_id: 3,
			run_attempt: 2,
			conclusion: "success",
			event: "pull_request",
			head_sha: SHA,
			head_branch: BRANCH,
			head_repository: { full_name: "owner/repo" },
			actor: { login: "dependabot[bot]", id: 49699333 },
		},
		workflow: { path: ".github/workflows/__rebuild-action-distributions.yml" },
		files: [{ filename: `${PACKAGE}/package-lock.json` }],
		artifacts: [
			{
				id: 20,
				name: "action-distributions-2",
				expired: false,
				size_in_bytes: 300,
			},
		],
		tree: { truncated: false, tree: [] },
		outputs: {},
		commits: [],
		reads: [],
	};
	const github = {
		rest: {
			repos: {
				getCommit: async (input) => {
					state.reads.push(input);
					return { data: { commit: { message: state.message } } };
				},
			},
			pulls: {
				get: async () => ({ data: state.pr }),
				list: async () => [state.pr],
				listFiles: async () => state.files,
			},
			actions: {
				getWorkflowRun: async ({ run_id }) => ({
					data: run_id === 11 ? state.writer : state.run,
				}),
				getWorkflow: async () => ({ data: state.workflow }),
				listWorkflowRunArtifacts: async () => state.artifacts,
			},
			git: { getTree: async () => ({ data: state.tree }) },
		},
		paginate: async (method, input) => method(input),
		graphql: async (_query, variables) => {
			if (variables.expression) {
				state.workflowReads.push(variables);
				return { repository: { object: { entries: state.definitions } } };
			}
			state.commits.push(variables.input);
		},
	};
	const context = {
		repo: { owner: "owner", repo: "repo" },
		actor: "dependabot[bot]",
		runId: 11,
		sha: TRUSTED_SHA,
		eventName: "workflow_run",
		payload: {
			repository: { default_branch: "main" },
			sender: structuredClone(state.pr.user),
			workflow_run: { id: 10, run_attempt: 2 },
			pull_request: structuredClone(state.pr),
		},
	};
	const automation = new ActionDistributions({
		options: {
			workingDirectories: PACKAGE,
			...options,
		},
		github,
		context,
		core: {
			info() {},
			setOutput: (key, value) => {
				state.outputs[key] = value;
			},
		},
	});
	const filename = path.join(temporary, "distributions.json");
	const write = (files = [file("index.js"), file("licenses.txt")]) =>
		fs.writeFileSync(filename, JSON.stringify(files));
	return { automation, state, context, temporary, filename, write, github };
}

test("commits additions, changes and deletions together with an atomic head guard", async (t) => {
	const { automation, state, filename, write } = fixture(t);
	state.tree.tree = [
		blob(file("index.js", "old")),
		blob(file("licenses.txt")),
		blob(file("obsolete.js")),
		{ path: "README.md", type: "blob", mode: "100644", sha: SHA },
	];
	write([file("index.js"), file("licenses.txt"), file("chunk.js")]);
	await automation.commit(filename);
	assert.deepEqual(state.commits, [
		{
			branch: { repositoryNameWithOwner: "owner/repo", branchName: BRANCH },
			expectedHeadOid: SHA,
			message: {
				headline: "build: regenerate action distributions [dependabot skip]",
				body: GENERATED_BY,
			},
			fileChanges: {
				additions: [file("index.js"), file("chunk.js")],
				deletions: [{ path: `${PACKAGE}/dist/obsolete.js` }],
			},
		},
	]);
	assert(state.reads.every((read) => read.ref === SHA));
});

test("unchanged distributions do not create a commit", async (t) => {
	const { automation, state, filename, write } = fixture(t);
	state.tree.tree = [blob(file("index.js")), blob(file("licenses.txt"))];
	write();
	await automation.commit(filename);
	assert.equal(state.commits.length, 0);
});

for (const [name, mutate] of [
	[
		"fork run",
		(s) => {
			s.run.head_repository.full_name = "fork/repo";
		},
	],
	[
		"human run",
		(s) => {
			s.run.actor.login = "human";
		},
	],
	[
		"failed run",
		(s) => {
			s.run.conclusion = "failure";
		},
	],
	[
		"non-PR run",
		(s) => {
			s.run.event = "push";
		},
	],
	[
		"old attempt",
		(s) => {
			s.run.run_attempt = 3;
		},
	],
	[
		"stale head",
		(s) => {
			s.pr.head.sha = "b".repeat(40);
		},
	],
	[
		"closed PR",
		(s) => {
			s.pr.state = "closed";
		},
	],
	[
		"human PR",
		(s) => {
			s.pr.user.login = "human";
		},
	],
	[
		"fork PR",
		(s) => {
			s.pr.head.repo.full_name = "fork/repo";
		},
	],
	[
		"different base",
		(s) => {
			s.pr.base.ref = "release";
		},
	],
	[
		"different branch",
		(s) => {
			s.pr.head.ref = "main";
		},
	],
	[
		"non-Dependabot branch",
		(s) => {
			s.run.head_branch = "main";
			s.pr.head.ref = "main";
		},
	],
	[
		"unrelated update",
		(s) => {
			s.files = [{ filename: "README.md" }];
		},
	],
]) {
	test(`${name} cannot publish artifacts`, async (t) => {
		const { automation, state, filename } = fixture(t);
		mutate(state);
		await automation.prepare();
		await automation.commit(filename);
		assert.equal(state.outputs["artifact-id"], undefined);
		assert.equal(state.commits.length, 0);
	});
}

test("selects only the artifact from the successful current attempt", async (t) => {
	const { automation, state } = fixture(t);
	state.artifacts.push({
		id: 19,
		name: "action-distributions-1",
		expired: false,
	});
	await automation.prepare();
	assert.equal(state.outputs["artifact-id"], 20);
});

for (const [name, mutate] of [
	[
		"wrong workflow",
		(s) => {
			s.workflow.path = ".github/workflows/other.yml";
		},
	],
	[
		"missing artifact",
		(s) => {
			s.artifacts = [];
		},
	],
	[
		"expired artifact",
		(s) => {
			s.artifacts[0].expired = true;
		},
	],
	[
		"oversized artifact",
		(s) => {
			s.artifacts[0].size_in_bytes = 21 * 1024 * 1024;
		},
	],
	[
		"duplicate artifact",
		(s) => {
			s.artifacts.push(s.artifacts[0]);
		},
	],
	[
		"oversized PR",
		(s) => {
			s.pr.changed_files = 3001;
		},
	],
]) {
	test(`rejects ${name}`, async (t) => {
		const { automation, state } = fixture(t);
		mutate(state);
		await assert.rejects(automation.prepare());
		assert.equal(state.outputs["artifact-id"], undefined);
	});
}

for (const [name, files] of [
	["path traversal", [file("../package.json")]],
	[
		"workflow path",
		[{ path: ".github/workflows/ci.yml", contents: encode("bad") }],
	],
	[
		"other package",
		[{ path: "actions/other/dist/index.js", contents: encode("bad") }],
	],
	["duplicate path", [file("index.js"), file("index.js")]],
	["invalid encoding", [{ path: `${PACKAGE}/dist/index.js`, contents: "%%%" }]],
	["missing license", [file("index.js")]],
	["missing entrypoint", [file("licenses.txt")]],
	["empty artifact", []],
]) {
	test(`rejects ${name} before any commit`, async (t) => {
		const { automation, state, filename, write } = fixture(t);
		write(files);
		await assert.rejects(automation.commit(filename));
		assert.equal(state.commits.length, 0);
	});
}

test("refuses truncated trees and symlink distributions", async (t) => {
	const { automation, state, filename, write } = fixture(t);
	write();
	state.tree.truncated = true;
	await assert.rejects(automation.commit(filename), /truncated/);
	state.tree.truncated = false;
	state.tree.tree = [
		{
			path: `${PACKAGE}/dist/index.js`,
			mode: "120000",
			type: "blob",
			sha: SHA,
		},
	];
	await assert.rejects(automation.commit(filename), /file mode/);
});

test("propagates an atomic commit conflict without retrying or forcing", async (t) => {
	const { automation, github, filename, write } = fixture(t);
	write();
	let attempts = 0;
	const graphql = github.graphql;
	github.graphql = async (query, variables) => {
		if (variables.expression) return graphql(query, variables);
		attempts++;
		throw new Error("Expected head mismatch");
	};
	await assert.rejects(automation.commit(filename), /head mismatch/);
	assert.equal(attempts, 1);
});

test("grouped lockfile and bundler updates select all affected configured packages", async (t) => {
	const { automation, state } = fixture(t);
	automation.options.directories.push("actions/other", "actions/unaffected");
	state.files = [
		{ filename: `${PACKAGE}/package-lock.json` },
		{ filename: "actions/other/package.json" },
	];
	assert.deepEqual(await automation.affectedPackages(state.pr), [
		PACKAGE,
		"actions/other",
	]);
});

test("requires complete output for every package in a grouped update", async (t) => {
	const { automation, state, filename, write } = fixture(t);
	automation.options.directories.push("actions/other");
	state.files.push({ filename: "actions/other/package-lock.json" });
	write();
	await assert.rejects(
		automation.commit(filename),
		/Missing required distribution files/,
	);
	write([
		file("index.js"),
		file("licenses.txt"),
		{ path: "actions/other/dist/index.js", contents: encode("other") },
		{ path: "actions/other/dist/licenses.txt", contents: encode("MIT") },
	]);
	await automation.commit(filename);
	assert.equal(state.commits.length, 1);
	assert.equal(state.commits[0].fileChanges.additions.length, 4);
});

test("a human update and stale build do not execute dependency code", async (t) => {
	const { automation, context, state, temporary, filename } = fixture(t);
	context.eventName = "pull_request";
	context.payload.sender.login = "human";
	const execute = () => assert.fail("Unexpected execution");
	await automation.build({ workspace: temporary, output: filename, execute });
	context.payload.sender.login = "dependabot[bot]";
	state.pr.head.sha = "b".repeat(40);
	await automation.build({ workspace: temporary, output: filename, execute });
	assert(!fs.existsSync(filename));
});

test("builds with npm lifecycle scripts disabled and serializes generated bytes", async (t) => {
	const { automation, context, temporary, filename, state } = fixture(t);
	context.eventName = "pull_request";
	const calls = [];
	await automation.build({
		workspace: temporary,
		output: filename,
		execute: (command, args, options) => {
			calls.push({ command, args, cwd: options.cwd });
			if (args[0] !== "run") return;
			fs.mkdirSync(path.join(options.cwd, "dist"), { recursive: true });
			fs.writeFileSync(
				path.join(options.cwd, "dist/index.js"),
				"module.exports = 42;",
			);
			fs.writeFileSync(path.join(options.cwd, "dist/licenses.txt"), "MIT");
		},
	});
	assert.deepEqual(
		calls.map((call) => call.args),
		[
			["ci", "--no-audit", "--no-fund", "--ignore-scripts=true"],
			["run", "build"],
		],
	);
	assert(
		calls.every(
			(call) =>
				call.command === "npm" && call.cwd === path.join(temporary, PACKAGE),
		),
	);
	assert.equal(automation.readPayload(filename, [PACKAGE]).length, 2);
	assert.equal(state.outputs.built, "true");
});

test("builds a real package and supports no-change reruns", async (t) => {
	const { automation, context, temporary, filename } = fixture(t);
	context.eventName = "pull_request";
	const directory = path.join(temporary, PACKAGE);
	fs.mkdirSync(directory, { recursive: true });
	fs.writeFileSync(
		path.join(directory, "package.json"),
		JSON.stringify({
			name: "fixture",
			version: "1.0.0",
			scripts: { build: "node build.cjs", preinstall: "exit 99" },
		}),
	);
	fs.writeFileSync(
		path.join(directory, "package-lock.json"),
		JSON.stringify({
			name: "fixture",
			version: "1.0.0",
			lockfileVersion: 3,
			packages: {
				"": { name: "fixture", version: "1.0.0", hasInstallScript: true },
			},
		}),
	);
	fs.writeFileSync(
		path.join(directory, "build.cjs"),
		"const fs = require('node:fs'); fs.mkdirSync('dist', {recursive:true}); fs.writeFileSync('dist/index.js', 'example'); fs.writeFileSync('dist/licenses.txt', 'MIT');",
	);
	await automation.run("build", {
		workspace: temporary,
		artifactPath: filename,
	});
	const first = fs.readFileSync(filename, "utf8");
	await automation.run("build", {
		workspace: temporary,
		artifactPath: filename,
	});
	assert.equal(fs.readFileSync(filename, "utf8"), first);
});

for (const [name, options] of [
	["traversal", { workingDirectories: "../actions/example" }],
	["duplicates", { workingDirectories: `${PACKAGE}\n${PACKAGE}` }],
	["overlap", { workingDirectories: `${PACKAGE}\n${PACKAGE}/nested` }],
	["root overlap", { workingDirectories: `.\n${PACKAGE}` }],
	["absolute output", { outputDirectory: "/tmp/bundle" }],
	["unsafe output", { outputDirectory: "../.github" }],
	["unsafe required file", { requiredFiles: "../package.json" }],
	["npm flags", { buildScript: "--help" }],
	["shell command", { buildScript: "build && echo bad" }],
	["artifact traversal", { artifactName: "../bundle" }],
	["unknown preset", { pullRequestAuthors: '["unknown"]' }],
	["missing author ID", { pullRequestAuthors: '[{"login":"example[bot]"}]' }],
	["empty authors", { pullRequestAuthors: "[]" }],
	["multiline headline", { commitMessage: "build: bundles\n[skip ci]" }],
	[
		"multiline suffix",
		{
			pullRequestAuthors:
				'[{"login":"example","id":123,"commit-message-suffix":"\\nbody"}]',
		},
	],
]) {
	test(`rejects ${name} workflow input`, () => {
		assert.throws(() => new DistributionOptions(options));
	});
}

const CUSTOM_AUTHOR = {
	login: "example[bot]",
	id: 123456,
	"branch-prefix": "updates/",
};
for (const author of [
	{ login: "renovate[bot]", id: 29139614, "branch-prefix": "renovate/" },
	CUSTOM_AUTHOR,
]) {
	test(`${author.login} builds and commits with its configured policy`, async (t) => {
		const { automation, state, context, filename, write } = fixture(t, {
			pullRequestAuthors: JSON.stringify([
				"dependabot",
				"renovate",
				CUSTOM_AUTHOR,
			]),
			artifactName: "custom-bundle",
			commitMessage: "build: update bundles",
		});
		state.pr.user = { login: author.login, id: author.id };
		state.run.actor = structuredClone(state.pr.user);
		context.payload.sender = structuredClone(state.pr.user);
		state.pr.head.ref =
			state.run.head_branch = `${author["branch-prefix"]}example`;
		context.payload.pull_request = structuredClone(state.pr);
		state.workflow.path = state.run.path = ".github/workflows/custom-build.yml";
		state.definitions[1].name = "custom-build.yml";
		state.artifacts[0].name = "custom-bundle-2";
		context.eventName = "pull_request";
		await automation.prepareBuild();
		assert.equal(state.outputs["head-sha"], SHA);
		context.eventName = "workflow_run";
		await automation.prepare();
		assert.equal(state.outputs["artifact-id"], 20);
		write();
		await automation.commit(filename);
		assert.equal(state.commits[0].message.headline, "build: update bundles");
		assert.equal(state.commits[0].message.body, GENERATED_BY);
		state.message = `${state.commits[0].message.headline}\n\n${GENERATED_BY}`;
		state.outputs = {};
		context.eventName = "pull_request";
		await automation.prepareBuild();
		assert.equal(state.outputs["head-sha"], undefined);
		context.eventName = "workflow_run";
		await automation.prepare();
		await automation.commit(filename);
		assert.equal(state.outputs["artifact-id"], undefined);
		assert.equal(
			state.commits.length,
			1,
			"same-App generated commits cannot loop",
		);
	});
}

for (const target of ["author", "actor"]) {
	test(`rejects a matching login with the wrong ${target} ID`, async (t) => {
		const { automation, state, context, filename } = fixture(t);
		if (target === "author") state.pr.user.id = 123;
		else {
			state.run.actor.id = 123;
			context.payload.sender.id = 123;
		}
		await automation.prepare();
		await automation.commit(filename);
		context.eventName = "pull_request";
		await automation.prepareBuild();
		assert.deepEqual(state.outputs, {});
		assert.equal(state.commits.length, 0);
	});
}

test("builds and commits a root action using custom script, output and required files", async (t) => {
	const { automation, context, state, temporary, filename } = fixture(t, {
		workingDirectories: ".",
		outputDirectory: "lib/bundle",
		requiredFiles: "main.cjs\nNOTICE",
		buildScript: "bundle:ci",
	});
	context.eventName = "pull_request";
	const calls = [];
	await automation.build({
		workspace: temporary,
		output: filename,
		execute: (_command, args, { cwd }) => {
			calls.push(args);
			assert.equal(cwd, temporary);
			if (args[0] !== "run") return;
			const destination = path.join(cwd, "lib/bundle");
			fs.mkdirSync(destination, { recursive: true });
			fs.writeFileSync(
				path.join(destination, "main.cjs"),
				"export default 42;",
			);
			fs.writeFileSync(path.join(destination, "NOTICE"), "MIT");
		},
	});
	assert.deepEqual(calls[1], ["run", "bundle:ci"]);
	context.eventName = "workflow_run";
	await automation.commit(filename);
	assert.deepEqual(
		state.commits[0].fileChanges.additions.map((entry) => entry.path),
		["lib/bundle/NOTICE", "lib/bundle/main.cjs"],
	);
	state.files = [{ filename: "lib/bundle/main.cjs" }];
	assert.deepEqual(await automation.affectedPackages(state.pr), []);
});

test("an artifact cannot expand the trusted writer's output directory", async (t) => {
	const { automation, state, filename, write } = fixture(t, {
		outputDirectory: "bundle",
	});
	write();
	await assert.rejects(automation.commit(filename), /outside allowed/);
	assert.equal(state.commits.length, 0);
});

test("an empty required-files input still requires output for each affected package", async (t) => {
	const { automation, state, filename, write } = fixture(t, {
		requiredFiles: "",
	});
	write([file("custom.cjs")]);
	await automation.commit(filename);
	assert.equal(state.commits.length, 1);
	automation.options.directories.push("actions/other");
	state.files.push({ filename: "actions/other/package.json" });
	await assert.rejects(automation.commit(filename), /Missing required/);
});

test("the action entrypoint prepares and commits the validated artifact", async (t) => {
	const { automation, state, filename, write } = fixture(t);
	await automation.run("prepare-commit");
	assert.equal(state.outputs["artifact-id"], 20);
	write();
	await automation.run("commit", { artifactPath: filename });
	assert.equal(state.commits.length, 1);
	assert.equal(state.commits[0].expectedHeadOid, SHA);
});

test("the action entrypoint skips publication for a writer completion", async (t) => {
	const { automation, state, filename } = fixture(t);
	state.run.event = "workflow_run";
	await automation.run("prepare-commit");
	await automation.run("commit", { artifactPath: filename });
	assert.deepEqual(state.outputs, {});
	assert.equal(state.commits.length, 0);
});

test("the action rejects unknown operations without executing dependency or writer code", async (t) => {
	const { automation, state } = fixture(t);
	await assert.rejects(
		automation.run("unknown"),
		/Unsupported distribution operation/,
	);
	assert.deepEqual(state.reads, []);
	assert.deepEqual(state.commits, []);
});

test("automatic writer discovery uses only base manifests and rejects newly introduced output paths", async (t) => {
	const { automation, state, github, filename, write } = fixture(t, {
		workingDirectories: "",
	});
	state.pr.base.sha = "b".repeat(40);
	const discoveryRefs = [];
	github.rest.git.getTree = async ({ tree_sha }) => {
		discoveryRefs.push(tree_sha);
		return {
			data: {
				truncated: false,
				tree: [
					{
						path: `${PACKAGE}/package.json`,
						type: "blob",
						mode: "100644",
						sha: "manifest",
					},
				],
			},
		};
	};
	github.rest.git.getBlob = async ({ file_sha }) => {
		assert.equal(file_sha, "manifest");
		return {
			data: {
				encoding: "base64",
				content: encode(
					JSON.stringify({
						scripts: { build: "build", "check:dist": "check" },
					}),
				),
			},
		};
	};
	state.files.push({ filename: "actions/untrusted/package.json" });
	write([
		...[file("index.js"), file("licenses.txt")],
		{ path: "actions/untrusted/dist/index.js", contents: encode("untrusted") },
	]);
	await assert.rejects(automation.commit(filename), /outside allowed/);
	assert.deepEqual(discoveryRefs, [state.pr.base.sha]);
	assert.equal(state.commits.length, 0);
});

test("resolves the builder only from the writer's pinned default-branch configuration", async (t) => {
	const { automation, state } = fixture(t);
	// Run names are not an authorization source: a PR can change them.
	state.run.name = "PR-controlled name";
	state.workflow.name = "PR-controlled registry name";
	await automation.prepare();
	assert.equal(state.outputs["artifact-id"], 20);
	assert.deepEqual(state.workflowReads, [
		{
			owner: "owner",
			repo: "repo",
			expression: `${TRUSTED_SHA}:.github/workflows`,
		},
	]);
});

for (const [name, mutate, message] of [
	[
		"PR-only workflow with a spoofed builder name",
		(s) => {
			s.workflow.path = s.run.path = ".github/workflows/spoof.yml";
			s.run.name = "Build";
		},
		/Unexpected builder/,
	],
	[
		"different run path",
		(s) => {
			s.run.path = ".github/workflows/spoof.yml";
		},
		/Unexpected builder run path/,
	],
	[
		"duplicate default-branch names",
		(s) => {
			s.definitions.push(
				workflowFile("other.yml", "name: Build\non: pull_request"),
			);
		},
		/exactly one trusted workflow/,
	],
	[
		"missing builder",
		(s) => {
			s.definitions.pop();
		},
		/exactly one trusted workflow/,
	],
	[
		"missing writer",
		(s) => {
			s.definitions.shift();
		},
		/one exact builder name/,
	],
	[
		"missing filter",
		(s) => {
			s.definitions[0].object.text = "on: workflow_run";
		},
		/one exact builder name/,
	],
	[
		"wildcard filter",
		(s) => {
			s.definitions[0].object.text =
				'on: {workflow_run: {workflows: ["Build*"]}}';
		},
		/one exact builder name/,
	],
	[
		"multiple builders",
		(s) => {
			s.definitions[0].object.text =
				"on: {workflow_run: {workflows: [Build, Other]}}";
		},
		/one exact builder name/,
	],
	[
		"builder without a PR trigger",
		(s) => {
			s.definitions[1].object.text = "name: Build\non: push";
		},
		/pull_request trigger/,
	],
	[
		"truncated configuration",
		(s) => {
			s.definitions[1].object.isTruncated = true;
		},
		/complete regular workflow/,
	],
	[
		"symlink workflow",
		(s) => {
			s.definitions[1].mode = 0o120000;
		},
		/complete regular workflow/,
	],
	[
		"duplicate YAML keys",
		(s) => {
			s.definitions[1].object.text =
				"name: Build\nname: Other\non: pull_request";
		},
		/unique/,
	],
	[
		"incorrect writer event",
		(s) => {
			s.writer.event = "pull_request";
		},
		/workflow_run writer/,
	],
	[
		"mismatched writer revision",
		(s) => {
			s.writer.head_sha = SHA;
		},
		/writer revision/,
	],
]) {
	test(`rejects ${name} before artifact selection or publication`, async (t) => {
		const { automation, state, filename } = fixture(t);
		mutate(state);
		await assert.rejects(automation.prepare(), message);
		await assert.rejects(automation.commit(filename), message);
		assert.deepEqual(state.outputs, {});
		assert.deepEqual(state.commits, []);
	});
}

for (const trigger of [
	"[push, pull_request]",
	"{pull_request: {branches: [main]}}",
]) {
	test(`supports builder trigger ${trigger} and YAML aliases in the writer`, async (t) => {
		const { automation, state } = fixture(t);
		state.definitions[0].object.text =
			"run-name: &builder Build\non: {workflow_run: {workflows: [*builder]}}";
		state.definitions[1].object.text = `name: Build\non: ${trigger}`;
		await automation.prepare();
		assert.equal(state.outputs["artifact-id"], 20);
	});
}

test("supports the workflow path as its default name and a scalar filter", async (t) => {
	const { automation, state } = fixture(t);
	state.definitions[0].object.text = `on: {workflow_run: {workflows: ${BUILDER_PATH}}}`;
	state.definitions[1].object.text = "on: pull_request";
	await automation.prepare();
	assert.equal(state.outputs["artifact-id"], 20);
});

for (const ignoreScripts of ["true", "false"]) {
	test(`builds all pnpm workspace outputs once with ignore-scripts=${ignoreScripts}`, async (t) => {
		// Arrange
		const outputs = ["actions/a/dist", "actions/b/dist"];
		const { automation, context, temporary, filename, state } = fixture(t, {
			workingDirectories: ".",
			outputDirectory: outputs.join("\n"),
			requiredFiles: "index.js",
			packageManager: "pnpm",
			ignoreScripts,
			buildScript: "package",
		});
		context.eventName = "pull_request";
		state.files = [{ filename: "pnpm-lock.yaml" }];
		const calls = [];
		// Act
		await automation.build({
			workspace: temporary,
			output: filename,
			execute: (command, args, { cwd }) => {
				calls.push({ command, args, cwd });
				if (args[0] !== "run") return;
				for (const output of outputs) {
					fs.mkdirSync(path.join(cwd, output), { recursive: true });
					fs.writeFileSync(path.join(cwd, output, "index.js"), "bundle");
				}
			},
		});
		context.eventName = "workflow_run";
		await automation.commit(filename);
		// Assert
		assert.deepEqual(calls, [
			{
				command: "pnpm",
				args: [
					"install",
					"--frozen-lockfile",
					`--ignore-scripts=${ignoreScripts}`,
				],
				cwd: temporary,
			},
			{ command: "pnpm", args: ["run", "package"], cwd: temporary },
		]);
		assert.equal(state.commits.length, 1);
		assert.deepEqual(
			state.commits[0].fileChanges.additions.map((file) => file.path),
			outputs.map((output) => `${output}/index.js`),
		);
	});
}

for (const outputDirectory of [
	"actions/*/dist",
	"dist\ndist",
	"dist\ndist/nested",
	"dist\n../outside",
	"",
]) {
	test(`rejects ambiguous output allowlist ${JSON.stringify(outputDirectory)}`, () => {
		assert.throws(() => new DistributionOptions({ outputDirectory }));
	});
}

for (const options of [
	{ packageManager: "yarn" },
	{ ignoreScripts: "yes" },
	{ maxArtifactSize: 0 },
	{ maxArtifactSize: 129 },
	{ maxArtifactSize: 1.5 },
	{ maxArtifactSize: "bad" },
]) {
	test(`rejects invalid build settings ${JSON.stringify(options)}`, () => {
		assert.throws(() => new DistributionOptions(options));
	});
}

test("every configured workspace output must be present and cannot authorize neighboring source", async (t) => {
	// Arrange
	const { automation, state, filename, write } = fixture(t, {
		workingDirectories: ".",
		outputDirectory: "actions/a/dist\nactions/b/dist",
		requiredFiles: "index.js",
	});
	const allowed = ["actions/a/dist/index.js", "actions/b/dist/index.js"].map(
		(path) => ({ path, contents: encode("bundle") }),
	);
	// Act / Assert: each rejected payload must leave the branch untouched.
	for (const files of [
		allowed.slice(0, 1),
		[...allowed, { path: "actions/a/action.yml", contents: encode("bad") }],
		[...allowed, { path: "actions/c/dist/index.js", contents: encode("bad") }],
	]) {
		write(files);
		await assert.rejects(automation.commit(filename));
	}
	assert.deepEqual(state.commits, []);
	state.files = allowed.map(({ path: filename }) => ({ filename }));
	assert.deepEqual(await automation.affectedPackages(state.pr), []);
});

test("large artifacts use blob publication with a guarded single commit", async (t) => {
	// Arrange
	const { automation, state, github, filename, write } = fixture(t, {
		maxArtifactSize: 128,
	});
	const calls = [];
	github.rest.git.createBlob = async (input) => {
		calls.push(["blob", input.content.length]);
		return { data: { sha: "blob" } };
	};
	github.rest.git.getCommit = async () => ({
		data: { tree: { sha: "base-tree" } },
	});
	github.rest.git.createTree = async (input) => {
		calls.push(["tree", input]);
		return { data: { sha: "tree" } };
	};
	github.rest.git.createCommit = async (input) => {
		calls.push(["commit", input]);
		return { data: { sha: "new-head" } };
	};
	const graphql = github.graphql;
	github.graphql = async (query, input) => {
		if (query.includes("UpdateRefsInput")) {
			calls.push(["update", input.input]);
			return {};
		}
		if (query.includes("{ id }")) return { repository: { id: "repository" } };
		return graphql(query, input);
	};
	write([file("index.js", "x".repeat(16 * 1024 * 1024)), file("licenses.txt")]);
	// Act
	await automation.commit(filename);
	// Assert
	assert.equal(state.commits.length, 0);
	assert.equal(calls.filter(([name]) => name === "commit").length, 1);
	assert.deepEqual(calls.at(-1), [
		"update",
		{
			repositoryId: "repository",
			refUpdates: [
				{
					name: `refs/heads/${BRANCH}`,
					beforeOid: SHA,
					afterOid: "new-head",
					force: false,
				},
			],
		},
	]);
});

test("the trusted writer enforces its own size limit before reading an oversized payload", async (t) => {
	// Arrange
	const { automation, state, filename } = fixture(t, { maxArtifactSize: 1 });
	const descriptor = fs.openSync(filename, "w");
	fs.ftruncateSync(descriptor, 1024 * 1024 + 1);
	fs.closeSync(descriptor);
	// Act
	const result = automation.commit(filename);
	// Assert
	await assert.rejects(result, /size limit/);
	assert.deepEqual(state.commits, []);
});
