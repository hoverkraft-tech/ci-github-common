import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mock, test } from "node:test";
import { fileURLToPath } from "node:url";
import { run } from "./index.js";

const conventionalPreset = fileURLToPath(
	import.meta.resolve("@commitlint/config-conventional"),
);

function workspace(t) {
	const directory = mkdtempSync(join(tmpdir(), "title-policy-"));
	t.after(() => rmSync(directory, { recursive: true, force: true }));
	return directory;
}

function reporter() {
	return { info: mock.fn(), warning: mock.fn(), setFailed: mock.fn() };
}

const cases = [
	["feature", "feat: add a shared validator", true],
	["breaking change", "feat(api)!: require a release tag", true],
	["dependency update", "build(deps): bump a dependency", true],
	[
		"uppercase subject",
		"build(deps): Bump a dependency",
		false,
		"subject-case",
	],
	["unknown type", "unknown: add a validator", false, "type-enum"],
	["missing subject", "fix:", false, "subject-empty"],
	["trailing period", "fix: add a validator.", false, "subject-full-stop"],
	["long header", "fix: ".padEnd(101, "x"), false, "header-max-length"],
	["generated merge", "Merge pull request #1 from example/branch", false],
	["generated revert", 'Revert "feat: add a validator"', false],
	["version", "v1.2.3", false],
	["empty title", "", false],
	["whitespace title", "   ", false],
];

for (const [name, title, valid, rule] of cases) {
	test(`conventional fallback: ${name}`, async (t) => {
		// Arrange
		const cwd = workspace(t);
		const core = reporter();
		const context = { payload: { pull_request: { title } } };

		// Act
		await run({ core, context, cwd });

		// Assert
		assert.equal(core.setFailed.mock.callCount(), valid ? 0 : 1);
		if (rule) {
			assert.ok(core.info.mock.calls[0].arguments[0].includes(rule));
		}
	});
}

for (const filename of [".commitlintrc.json", "package.json"]) {
	test(`discovers repository rules in ${filename}`, async (t) => {
		// Arrange
		const cwd = workspace(t);
		const config = {
			extends: [conventionalPreset],
			rules: { "type-enum": [2, "always", ["task"]] },
		};
		writeFileSync(
			join(cwd, filename),
			JSON.stringify(
				filename === "package.json" ? { commitlint: config } : config,
			),
		);
		const core = reporter();

		// Act
		await run({
			core,
			context: {
				payload: { pull_request: { title: "task: update a dependency" } },
			},
			cwd,
		});

		// Assert
		assert.equal(core.setFailed.mock.callCount(), 0);
	});
}

test("repository warnings apply equally to contributors and bots", async (t) => {
	// Arrange
	const cwd = workspace(t);
	writeFileSync(
		join(cwd, ".commitlintrc.json"),
		JSON.stringify({
			extends: [conventionalPreset],
			rules: {
				"subject-case": [1, "never", ["sentence-case"]],
				"header-max-length": [1, "always", 100],
			},
		}),
	);
	for (const actor of ["contributor", "dependabot[bot]", "renovate[bot]"]) {
		const core = reporter();
		const context = {
			actor,
			payload: {
				pull_request: {
					title: `build(deps): Bump ${"a-dependency-".repeat(10)}`,
				},
			},
		};

		// Act
		await run({ core, context, cwd });

		// Assert
		assert.equal(core.setFailed.mock.callCount(), 0, actor);
		assert.equal(core.warning.mock.callCount(), 2, actor);
		assert.match(core.warning.mock.calls[0].arguments[0], /header-max-length/);
		assert.match(core.warning.mock.calls[1].arguments[0], /subject-case/);
	}
});

test("repository errors still fail when other rules only warn", async (t) => {
	// Arrange
	const cwd = workspace(t);
	writeFileSync(
		join(cwd, ".commitlintrc.json"),
		JSON.stringify({
			extends: [conventionalPreset],
			rules: { "subject-case": [1, "never", ["sentence-case"]] },
		}),
	);
	const core = reporter();

	// Act
	await run({
		core,
		context: {
			payload: { pull_request: { title: "unknown: Update a dependency" } },
		},
		cwd,
	});

	// Assert
	assert.equal(core.setFailed.mock.callCount(), 1);
	assert.match(core.info.mock.calls[0].arguments[0], /type-enum/);
	assert.equal(core.warning.mock.callCount(), 1);
});

test("loads relative presets and repository plugins from a JavaScript config", async (t) => {
	// Arrange
	const cwd = workspace(t);
	writeFileSync(
		join(cwd, "commitlint.config.cjs"),
		'module.exports = { extends: ["./policy.cjs"] };',
	);
	writeFileSync(
		join(cwd, "policy.cjs"),
		`module.exports = {
			extends: [${JSON.stringify(conventionalPreset)}],
			plugins: [{ rules: { "subject-ticket": ({subject}) => [subject.includes("ticket"), "include a ticket"] } }],
			rules: { "subject-ticket": [2, "always"] },
		};`,
	);
	const core = reporter();

	// Act
	await run({
		core,
		context: {
			payload: { pull_request: { title: "fix: update a dependency" } },
		},
		cwd,
	});

	// Assert
	assert.equal(core.setFailed.mock.callCount(), 1);
	assert.match(core.info.mock.calls[0].arguments[0], /include a ticket/);
});

test("honors repository ignore settings", async (t) => {
	// Arrange
	const cwd = workspace(t);
	writeFileSync(
		join(cwd, "commitlint.config.cjs"),
		`module.exports = {
			extends: [${JSON.stringify(conventionalPreset)}],
			defaultIgnores: true,
			ignores: [(message) => message === "custom generated title"],
		};`,
	);
	for (const title of ["v1.2.3", "custom generated title"]) {
		const core = reporter();

		// Act
		await run({ core, context: { payload: { pull_request: { title } } }, cwd });

		// Assert
		assert.equal(core.setFailed.mock.callCount(), 0);
	}
});

for (const [name, content, error] of [
	["malformed config", "{ invalid json", /JSON/],
	[
		"missing preset",
		'{"extends":["./missing-preset.cjs"]}',
		/Cannot find module/,
	],
]) {
	test(`${name} fails instead of falling back`, async (t) => {
		// Arrange
		const cwd = workspace(t);
		writeFileSync(join(cwd, ".commitlintrc.json"), content);

		// Act / Assert
		await assert.rejects(
			run({
				core: reporter(),
				context: {
					payload: { pull_request: { title: "fix: update a dependency" } },
				},
				cwd,
			}),
			error,
		);
	});
}

test("resolves the bundled preset without installing repository dependencies", (t) => {
	// Arrange
	const cwd = workspace(t);
	writeFileSync(
		join(cwd, ".commitlintrc.json"),
		JSON.stringify({
			extends: ["@commitlint/config-conventional"],
			rules: { "subject-case": [1, "never", ["sentence-case"]] },
		}),
	);

	// Act
	const output = execFileSync(
		process.execPath,
		[
			"--input-type=module",
			"-e",
			`import { run } from ${JSON.stringify(new URL("./index.js", import.meta.url).href)};
			await run({
				core: { info() {}, warning: console.log, setFailed(message) { throw new Error(message); } },
				context: { payload: { pull_request: { title: "build(deps): Bump a dependency" } } },
			});`,
		],
		{
			cwd,
			env: {
				...process.env,
				NODE_TEST_CONTEXT: undefined,
				GITHUB_WORKSPACE: cwd,
				NODE_PATH: fileURLToPath(new URL("../node_modules", import.meta.url)),
			},
			encoding: "utf8",
		},
	);

	// Assert
	assert.match(output, /subject-case/);
	assert.equal(existsSync(join(cwd, "node_modules")), false);
});

test("a pull request event is required", async () => {
	const core = reporter();
	await run({ core, context: { payload: {} } });
	assert.equal(core.setFailed.mock.callCount(), 1);
	assert.match(core.setFailed.mock.calls[0].arguments[0], /title is required/);
});

test("shell-like title content stays data", async (t) => {
	const cwd = workspace(t);
	const core = reporter();
	await run({
		core,
		context: {
			payload: {
				pull_request: { title: "fix: preserve $(touch injected) literally" },
			},
		},
		cwd,
	});
	assert.equal(core.setFailed.mock.callCount(), 0);
	assert.equal(existsSync(join(cwd, "injected")), false);
});
