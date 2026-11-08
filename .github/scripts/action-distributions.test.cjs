const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { ActionDistributions } = require("./action-distributions.cjs");

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

function fixture(t) {
	const temporary = fs.mkdtempSync(
		path.join(os.tmpdir(), "action-distributions-"),
	);
	t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
	const state = {
		packages: [PACKAGE],
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
				getContent: async (input) => {
					state.reads.push(input);
					return { data: { content: encode(JSON.stringify(state.packages)) } };
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
			workflow_run: { id: 10, run_attempt: 2 },
			pull_request: structuredClone(state.pr),
		},
	};
	const automation = new ActionDistributions({
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
			},
			fileChanges: {
				additions: [file("index.js"), file("chunk.js")],
				deletions: [{ path: `${PACKAGE}/dist/obsolete.js` }],
			},
		},
	]);
	assert(state.reads.every((read) => read.ref === "main"));
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
	state.packages.push("actions/other", "actions/unaffected");
	state.files = [
		{ filename: `${PACKAGE}/package-lock.json` },
		{ filename: "actions/other/package.json" },
	];
	assert.deepEqual(await automation.affectedPackages(state.pr), [
		PACKAGE,
		"actions/other",
	]);
});

for (const packages of [
	["../actions/example"],
	[PACKAGE, PACKAGE],
	[PACKAGE, `${PACKAGE}/nested`],
	[],
]) {
	test(`rejects invalid package configuration ${JSON.stringify(packages)}`, async (t) => {
		const { automation, state } = fixture(t);
		state.packages = packages;
		await assert.rejects(automation.configuration());
	});
}

test("requires complete output for every package in a grouped update", async (t) => {
	const { automation, state, filename, write } = fixture(t);
	state.packages.push("actions/other");
	state.files.push({ filename: "actions/other/package-lock.json" });
	write();
	await assert.rejects(
		automation.commit(filename),
		/Missing bundle or licenses/,
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
	context.actor = "human";
	const execute = () => assert.fail("Unexpected execution");
	await automation.build({ workspace: temporary, output: filename, execute });
	context.actor = "dependabot[bot]";
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
	await automation.build({ workspace: temporary, output: filename });
	const first = fs.readFileSync(filename, "utf8");
	await automation.build({ workspace: temporary, output: filename });
	assert.equal(fs.readFileSync(filename, "utf8"), first);
});
