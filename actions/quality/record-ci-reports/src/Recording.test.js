import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const { Recording } = await import(
	process.env.ACTION_ENTRYPOINT || "./Recording.js"
);

import { Protocol } from "./Protocol.js";

const junit =
	'<testsuite tests="1"><testcase name="example" file="index.js"/></testsuite>';

function fixture(t) {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "recording-test-"));
	t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	const workspace = path.join(directory, "project");
	fs.mkdirSync(workspace);
	execFileSync("git", ["init", "-q", workspace]);
	execFileSync("git", [
		"-C",
		workspace,
		"-c",
		"commit.gpgsign=false",
		"-c",
		"user.name=Fixture",
		"-c",
		"user.email=fixture@example.invalid",
		"commit",
		"--allow-empty",
		"-qm",
		"fixture",
	]);
	const sha = execFileSync("git", ["-C", workspace, "rev-parse", "HEAD"], {
		encoding: "utf8",
	}).trim();
	fs.writeFileSync(
		path.join(workspace, "index.js"),
		"export const example = 1;\n",
	);
	const uploads = [];
	const identity = {
		repository: "owner/project",
		repositoryId: "1",
		runId: "42",
		attempt: 1,
		job: {
			id: 3,
			name: "Any name",
			runner_id: 4,
			runner_name: "runner",
			started_at: "2026-11-27T12:00:00Z",
		},
	};
	const context = { sha, payload: {} };
	const recording = new Recording({
		workspace,
		temporaryDirectory: directory,
		context,
		execution: { current: async () => identity },
		artifacts: {
			uploadArtifact: async (name, files, root) => {
				assert.equal(
					files.length,
					new Set(files).size,
					"Upload each native file once",
				);
				const assets = Object.fromEntries(
					files.map((file) => [
						path.relative(root, file),
						fs.readFileSync(file, "utf8"),
					]),
				);
				uploads.push({ name, assets });
				return { id: uploads.length };
			},
		},
	});
	return { directory, workspace, uploads, recording, identity };
}

test("container checkout ownership is trusted only for the workspace revision read", (t) => {
	const state = fixture(t);
	const gitConfig = path.join(state.directory, "isolated-git-config");
	const env = {
		...process.env,
		GIT_TEST_ASSUME_DIFFERENT_OWNER: "1",
		GIT_CONFIG_GLOBAL: gitConfig,
		GIT_CONFIG_NOSYSTEM: "1",
	};
	const untrusted = () =>
		spawnSync("git", ["-C", state.workspace, "rev-parse", "HEAD"], {
			env,
			encoding: "utf8",
		});
	assert.match(untrusted().stderr, /dubious ownership/);
	const entrypoint = new URL(
		process.env.ACTION_ENTRYPOINT || "./Recording.js",
		import.meta.url,
	).href;
	const sha = execFileSync(
		process.execPath,
		[
			"--input-type=module",
			"-e",
			`import { Recording } from ${JSON.stringify(entrypoint)}; console.log(new Recording(JSON.parse(process.argv[1])).source({}).sha);`,
			JSON.stringify({
				workspace: state.workspace,
				temporaryDirectory: state.directory,
				context: state.recording.context,
			}),
		],
		{ env, encoding: "utf8" },
	).trim();
	assert.equal(sha, state.recording.context.sha);
	assert.equal(fs.existsSync(gitConfig), false);
	assert.match(untrusted().stderr, /dubious ownership/);
});

test("one combined native file satisfies both requirements and is uploaded once", async (t) => {
	const state = fixture(t);
	const prepared = await state.recording.prepare({
		reports: [
			{ kind: "test", pattern: "results.json" },
			{ kind: "coverage", pattern: "results.json" },
		],
	});
	fs.copyFileSync(
		new URL("./fixtures/jest-report.json", import.meta.url),
		path.join(prepared["report-directory"], "results.json"),
	);
	const finalized = await state.recording.finalize({
		recording: prepared.recording,
		outcome: "success",
		exitCode: 0,
	});
	assert.equal(finalized.complete, true, finalized.errors.join("\n"));
	const uploaded = state.uploads[1].assets;
	assert.deepEqual(Object.keys(uploaded).sort(), [
		"reports/results.json",
		"result.json",
	]);
	const assets = JSON.parse(uploaded["result.json"]).assets;
	assert.equal(assets.length, 2);
	assert.equal(assets.flatMap((asset) => asset.data.tests).length, 2);
	assert.equal(assets[1].data.coverage.lines.percentage, 50);
	assert.equal(assets[0].sha256, assets[1].sha256);
});

test("registration precedes execution; repeated checks in one job retain distinct native results", async (t) => {
	const state = fixture(t);
	const definition = { reports: [{ kind: "test", pattern: "junit.xml" }] };
	const first = await state.recording.prepare(definition);
	const second = await state.recording.prepare(definition);
	assert.notEqual(first["registration-id"], second["registration-id"]);
	assert.equal(state.uploads.length, 2);
	assert.deepEqual(fs.readdirSync(first["report-directory"]), []);
	fs.writeFileSync(path.join(first["report-directory"], "junit.xml"), junit);
	const result = await state.recording.finalize({
		recording: first.recording,
		outcome: "success",
		exitCode: 0,
	});
	assert.equal(result.complete, true);
	const manifest = JSON.parse(state.uploads[2].assets["result.json"]);
	assert.equal(
		manifest.registrationDigest,
		Protocol.digest(state.uploads[0].assets["registration.json"]),
	);
	assert.equal(manifest.assets[0].data.tests[0].file, "index.js");
	assert.equal(state.uploads[2].assets["reports/junit.xml"], junit);
	assert.equal(fs.existsSync(first.recording), false);
	assert.equal(fs.existsSync(second.recording), true);
});

test("a failed command and missing report remain separate failures; stale workspace files cannot satisfy the promise", async (t) => {
	const state = fixture(t);
	fs.writeFileSync(path.join(state.workspace, "junit.xml"), junit);
	const prepared = await state.recording.prepare({
		reports: [{ kind: "test", pattern: "junit.xml" }],
	});
	const result = await state.recording.finalize({
		recording: prepared.recording,
		outcome: "failure",
		exitCode: 7,
	});
	assert.equal(result.outcome, "failure");
	assert.equal(result.complete, false);
	assert.match(result.errors.join(" "), /Missing required test/);
	assert.equal(JSON.parse(state.uploads[1].assets["result.json"]).exitCode, 7);
});

test("malformed XML and symlinks fail validation while independent valid evidence is retained", async (t) => {
	const state = fixture(t);
	const prepared = await state.recording.prepare({
		reports: [{ kind: "test", pattern: "*.xml" }],
	});
	fs.writeFileSync(path.join(prepared["report-directory"], "good.xml"), junit);
	fs.writeFileSync(
		path.join(prepared["report-directory"], "bad.xml"),
		'<testsuite><testcase name="broken"></testsuite>',
	);
	fs.symlinkSync(
		path.join(state.workspace, "index.js"),
		path.join(prepared["report-directory"], "outside.xml"),
	);
	const result = await state.recording.finalize({
		recording: prepared.recording,
		outcome: "success",
		exitCode: 0,
	});
	assert.equal(result.complete, false);
	assert.match(result.errors.join(" "), /Invalid XML/);
	assert.match(result.errors.join(" "), /symlink/);
	assert.ok(state.uploads[1].assets["reports/good.xml"]);
});

test("registration upload failures stop preparation and clean only the new private directory", async (t) => {
	const state = fixture(t);
	state.recording.artifacts.uploadArtifact = async () => {
		throw new Error("unavailable");
	};
	await assert.rejects(
		state.recording.prepare({
			reports: [{ kind: "test", pattern: "junit.xml" }],
		}),
		/unavailable/,
	);
	assert.deepEqual(fs.readdirSync(state.directory), ["project"]);
});

test("definition rejects traversal, untyped selectors and unsupported outcome values", async (t) => {
	const state = fixture(t);
	for (const definition of [
		{ project: "../other", reports: [{ kind: "test", pattern: "junit.xml" }] },
		{ reports: [{ kind: "test", pattern: "../junit.xml" }] },
		{ reports: [{ kind: "unknown", pattern: "junit.xml" }] },
	])
		await assert.rejects(state.recording.prepare(definition));
	await assert.rejects(
		state.recording.finalize({ recording: "unused", outcome: "skipped" }),
		/outcome/,
	);
	assert.equal(state.uploads.length, 0);
});
