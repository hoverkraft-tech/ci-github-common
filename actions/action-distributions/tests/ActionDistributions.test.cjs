const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const {
	ActionDistributions,
	GENERATED_BY,
} = require("../src/ActionDistributions.cjs");

const { DistributionOptions } = require("../src/DistributionOptions.cjs");

const PACKAGE = "actions/example";
const SHA = "a".repeat(40);
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
		run: {
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
				getWorkflowRun: async () => ({ data: state.run }),
				getWorkflow: async () => ({ data: state.workflow }),
				listWorkflowRunArtifacts: async () => state.artifacts,
			},
			git: { getTree: async () => ({ data: state.tree }) },
		},
		paginate: async (method, input) => method(input),
		graphql: async (_query, { input }) => {
			state.commits.push(input);
		},
	};
	const context = {
		repo: { owner: "owner", repo: "repo" },
		actor: "dependabot[bot]",
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
			buildWorkflow: ".github/workflows/__rebuild-action-distributions.yml",
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
	github.graphql = async () => {
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
			["ci", "--ignore-scripts", "--no-audit", "--no-fund"],
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
	["empty directories", { workingDirectories: "" }],
	["absolute output", { outputDirectory: "/tmp/bundle" }],
	["unsafe output", { outputDirectory: "../.github" }],
	["unsafe required file", { requiredFiles: "../package.json" }],
	["npm flags", { buildScript: "--help" }],
	["shell command", { buildScript: "build && echo bad" }],
	["artifact traversal", { artifactName: "../bundle" }],
	["workflow traversal", { buildWorkflow: ".github/workflows/../ci.yml" }],
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
			buildWorkflow: ".github/workflows/custom-build.yml",
			commitMessage: "build: update bundles",
		});
		state.pr.user = { login: author.login, id: author.id };
		state.run.actor = structuredClone(state.pr.user);
		context.payload.sender = structuredClone(state.pr.user);
		state.pr.head.ref =
			state.run.head_branch = `${author["branch-prefix"]}example`;
		context.payload.pull_request = structuredClone(state.pr);
		state.workflow.path = ".github/workflows/custom-build.yml";
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

test("an omitted composite builder workflow input is accepted until publication", (t) => {
	const previous = process.env.BUILD_WORKFLOW;
	t.after(() => {
		if (previous === undefined) delete process.env.BUILD_WORKFLOW;
		else process.env.BUILD_WORKFLOW = previous;
	});
	process.env.BUILD_WORKFLOW = "";
	const options = new DistributionOptions(DistributionOptions.environment());
	assert.equal(options.buildWorkflow, undefined);
});
