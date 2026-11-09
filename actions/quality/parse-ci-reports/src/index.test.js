import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import * as glob from "@actions/glob";

const fixtures = {
	"node-junit.xml": {
		content:
			'<testsuites><testcase name="node failure" file="src/example.test.js"><failure/></testcase><testcase name="node skip"><skipped/></testcase></testsuites>',
		kind: "test",
		hasErrors: true,
	},
	"junit.xml": {
		content:
			'<testsuite name="suite" tests="1" failures="1"><testcase name="example" file="/app/src/example.js"><failure message="expected failure"/></testcase></testsuite>',
		kind: "test",
		hasErrors: true,
	},
	"results.tap": {
		content: "TAP version 13\n1..1\nok 1 - example\n",
		kind: "test",
		hasErrors: false,
	},
	"lcov.info": {
		content: "TN:\nSF:/app/src/example.js\nDA:1,1\nLF:1\nLH:1\nend_of_record\n",
		kind: "coverage",
		hasErrors: false,
	},
	"cobertura.xml": {
		content:
			'<coverage line-rate="1" branch-rate="1"><packages><package name="app"><classes><class name="Example" filename="src/example.js"><lines><line number="1" hits="1"/></lines></class></classes></package></packages></coverage>',
		kind: "coverage",
		hasErrors: false,
	},
	"eslint.json": {
		content:
			'[{"filePath":"/app/src/example.js","messages":[{"ruleId":"example","severity":2,"message":"diagnostic","line":1,"column":1}]}]',
		kind: "lint",
		hasErrors: true,
	},
	"checkstyle.xml": {
		content:
			'<checkstyle><file name="/app/src/example.js"><error line="1" column="1" severity="error" message="diagnostic" source="example"/></file></checkstyle>',
		kind: "lint",
		hasErrors: true,
	},
	"results.sarif": {
		content:
			'{"version":"2.1.0","runs":[{"tool":{"driver":{"name":"Example"}},"results":[{"ruleId":"example","level":"error","message":{"text":"diagnostic"},"locations":[{"physicalLocation":{"artifactLocation":{"uri":"/app/src/example.js"},"region":{"startLine":1}}}]}]}]}',
		kind: "lint",
		hasErrors: true,
	},
	"prettier-check.log": {
		content:
			"Checking formatting...\n[warn] src/example.js\n[warn] Code style issues found in the above file. Run Prettier with --write to fix.\n",
		kind: "lint",
		hasErrors: true,
	},
	"astro-check.log": {
		content: "src/example.astro:1:1 - error ts(2322): Example diagnostic\n",
		kind: "lint",
		hasErrors: true,
	},
};
function recorder() {
	const outputs = {},
		annotations = [],
		failures = [],
		summaries = [];
	const core = {
		info() {},
		warning: (message, properties) =>
			annotations.push(["warning", message, properties]),
		error: (message, properties) =>
			annotations.push(["error", message, properties]),
		setOutput: (name, value) => {
			outputs[name] = value;
		},
		setFailed: (message) => failures.push(message),
		summary: {
			addRaw(value) {
				summaries.push(value);
				return this;
			},
			async write() {},
		},
	};
	return { core, outputs, annotations, failures, summaries };
}
let root, reports, run;
before(async () => {
	root = mkdtempSync(path.join(tmpdir(), "parse-ci-reports-"));
	reports = path.join(root, "reports");
	mkdirSync(reports);
	({ run } = await import(
		process.env.ACTION_ENTRYPOINT
			? pathToFileURL(process.env.ACTION_ENTRYPOINT)
			: new URL("./index.js", import.meta.url)
	));
	for (const [name, { content }] of Object.entries(fixtures))
		writeFileSync(path.join(reports, name), content);
	mkdirSync(path.join(root, "empty"));
	writeFileSync(path.join(reports, "malformed.json"), "{ invalid json");
});
after(() => rmSync(root, { recursive: true, force: true }));
function inputs(reportPaths, overrides = {}) {
	return {
		workingDirectory: reports,
		reportPaths,
		reportName: "Reports",
		includePassed: true,
		outputFormat: "all",
		pathMapping: "/app:./application",
		...overrides,
	};
}
for (const [name, { kind, hasErrors }] of Object.entries(fixtures)) {
	it(`parses ${name} into reporting outputs`, async () => {
		const result = recorder();
		await run({ core: result.core, glob, inputs: inputs(name) });
		assert.equal(result.failures.length, 0);
		assert.ok(result.outputs.markdown);
		assert.ok(result.outputs[`${kind}-markdown`]);
		assert.equal(result.outputs["has-errors"], hasErrors);
		assert.deepEqual(JSON.parse(result.outputs["parsed-files"]), [
			path.join(reports, name),
		]);
		assert.ok(result.outputs.summary);
		assert.deepEqual(result.summaries, [result.outputs.summary]);
	});
}
describe("run", () => {
	it("rewrites annotations and exposes failures without failing reporting", async () => {
		const result = recorder();
		await run({
			core: result.core,
			glob,
			inputs: inputs("junit.xml,results.sarif,lcov.info"),
		});
		assert.equal(result.outputs["has-errors"], true);
		assert.equal(result.failures.length, 0);
		for (const kind of ["test", "lint", "coverage"])
			assert.ok(result.outputs[`${kind}-markdown`]);
		assert.ok(
			result.annotations.some(
				([, , properties]) =>
					properties?.file === "./application/src/example.js",
			),
		);
	});
	for (const pattern of [
		"absent.xml",
		"absent/*.xml",
		"junit.xml,absent.xml",
		"auto:test,absent.xml",
		"junit.xml,!junit.xml",
	]) {
		it(`rejects missing explicit reports: ${pattern}`, async () => {
			const result = recorder();
			await assert.rejects(
				run({ core: result.core, glob, inputs: inputs(pattern) }),
				/No report files matched explicit pattern/,
			);
			assert.equal(result.failures.length, 1);
			assert.notEqual(result.outputs["has-errors"], false);
		});
	}
	it("allows empty automatic discovery", async () => {
		const result = recorder();
		await run({
			core: result.core,
			glob,
			inputs: inputs("auto:all", {
				workingDirectory: path.join(root, "empty"),
			}),
		});
		assert.equal(result.outputs["parsed-files"], "[]");
		assert.equal(result.failures.length, 0);
		assert.equal(result.annotations[0][0], "warning");
	});
	it("supports mixed discovery, globs and unmatched exclusions", async () => {
		const result = recorder();
		await run({
			core: result.core,
			glob,
			inputs: inputs("auto:test,*.sarif,!absent/**"),
		});
		assert.ok(JSON.parse(result.outputs["parsed-files"]).length >= 2);
		assert.equal(result.failures.length, 0);
	});
	it("reports malformed input as an action failure", async () => {
		const result = recorder();
		await assert.rejects(
			run({ core: result.core, glob, inputs: inputs("malformed.json") }),
		);
		assert.equal(result.failures.length, 1);
	});
	it("rejects a missing working directory", async () => {
		const result = recorder();
		await assert.rejects(
			run({
				core: result.core,
				glob,
				inputs: inputs("auto:all", {
					workingDirectory: path.join(root, "absent"),
				}),
			}),
			/Directory does not exist/,
		);
		assert.equal(result.failures.length, 1);
	});
});
