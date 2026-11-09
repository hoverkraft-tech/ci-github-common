import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { DistributionTest } from "./DistributionTest.js";

function fixture(t) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "distribution-test-"));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const workspace = path.join(root, "package"),
		temporary = path.join(root, "temporary");
	fs.mkdirSync(path.join(workspace, "dist"), { recursive: true });
	fs.mkdirSync(temporary);
	fs.writeFileSync(
		path.join(workspace, "package.json"),
		JSON.stringify({ scripts: { "test:distribution": "node contract.cjs" } }),
	);
	fs.writeFileSync(
		path.join(workspace, "contract.cjs"),
		'require("node:assert/strict").equal(require(process.env.ACTION_ENTRYPOINT).value, 42);',
	);
	fs.writeFileSync(
		path.join(workspace, "dist/index.js"),
		"exports.value = 42;",
	);
	const run = new DistributionTest({
		io: {
			cp: async (source, target, options) => fs.cpSync(source, target, options),
			rmRF: async (target) =>
				fs.rmSync(target, { recursive: true, force: true }),
		},
		exec: {
			exec: async (command, args, options) =>
				execFileSync(command, args, { ...options, stdio: "pipe" }),
		},
	});
	return {
		workspace,
		temporary,
		run: () =>
			run.run({ workingDirectory: workspace, temporaryDirectory: temporary }),
	};
}

test("executes the package's contracts against only the copied bundle and cleans up", async (t) => {
	const { run, temporary } = fixture(t);
	await run();
	assert.deepEqual(fs.readdirSync(temporary), []);
});

test("missing bundled dependencies fail even when installed beside source; cleanup still runs", async (t) => {
	const { workspace, run, temporary } = fixture(t);
	fs.mkdirSync(path.join(workspace, "node_modules/fixture-dependency"), {
		recursive: true,
	});
	fs.writeFileSync(
		path.join(workspace, "node_modules/fixture-dependency/index.js"),
		"exports.value = 42;",
	);
	fs.writeFileSync(
		path.join(workspace, "dist/index.js"),
		'module.exports = require("fixture-dependency");',
	);
	await assert.rejects(run(), /Cannot find module 'fixture-dependency'/);
	assert.deepEqual(fs.readdirSync(temporary), []);
});

test("contract failures propagate", async (t) => {
	const { workspace, run, temporary } = fixture(t);
	fs.writeFileSync(path.join(workspace, "dist/index.js"), "exports.value = 0;");
	await assert.rejects(run(), /AssertionError/);
	assert.deepEqual(fs.readdirSync(temporary), []);
});

test("rejects symlinks and missing contract scripts", async (t) => {
	const { workspace, run } = fixture(t);
	fs.symlinkSync("../contract.cjs", path.join(workspace, "dist/escape.js"));
	await assert.rejects(run(), /symlinks/);
	fs.writeFileSync(path.join(workspace, "package.json"), "{}");
	await assert.rejects(run(), /test:distribution/);
});
