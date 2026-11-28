import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { NativeReports } from "./NativeReports.js";
import { Protocol } from "./Protocol.js";

const { CoveragePublication } = await import(
	process.env.ACTION_ENTRYPOINT || "./CoveragePublication.js"
);

const fixture = () =>
	JSON.parse(
		fs.readFileSync(
			new URL("./fixtures/jest-report.json", import.meta.url),
			"utf8",
		),
	);
const parse = (report, kind = "test") =>
	new NativeReports().parse(JSON.stringify(report), "results.json", kind);

test("combined JSON preserves outcomes, milliseconds and failures without counting coverage as tests", () => {
	const report = fixture();
	const tests = parse(report).data.tests;
	assert.deepEqual(
		tests.map((item) => item.status),
		["passed", "skipped"],
	);
	assert.equal(tests[0].duration, 0.125);
	report.success = false;
	report.testResults[0].status = "failed";
	report.testResults[0].assertionResults[0].status = "failed";
	report.testResults[0].assertionResults[0].failureMessages = [
		"expected 42, received 0",
	];
	assert.equal(parse(report).data.tests[0].message, "expected 42, received 0");
	const coverage = parse(report, "coverage");
	assert.deepEqual(coverage.data.tests, []);
	assert.equal(coverage.data.coverage.lines.percentage, 50);
	assert.equal(coverage.data.coverage.branches.percentage, 50);
	assert.deepEqual(coverage.sourceFiles, ["index.js"]);
});

test("missing or malformed coverage fails its requirement while test results remain available", () => {
	for (const coverageMap of [
		undefined,
		{},
		{ "index.js": { path: "index.js" } },
	]) {
		const report = { ...fixture(), coverageMap };
		assert.equal(parse(report).data.tests.length, 2);
		assert.throws(() => parse(report, "coverage"), /coverage|instrumented/i);
	}
	const report = fixture();
	report.coverageMap["index.js"].b[0] = [1, -1];
	assert.throws(() => parse(report, "coverage"), /hit counts/);
	report.coverageMap["index.js"].b[0] = [1];
	assert.throws(() => parse(report, "coverage"), /branch counts/);
});

test("failed suite setup and unsuccessful runs cannot be reported as passing assertions", () => {
	const report = fixture();
	report.success = false;
	report.testResults[0].status = "failed";
	report.testResults[0].message = "beforeAll failed";
	assert.equal(parse(report).data.tests.at(-1).message, "beforeAll failed");
	report.testResults[0].status = "passed";
	assert.equal(parse(report).data.tests.at(-1).status, "error");
	report.numTotalTests++;
	assert.throws(() => parse(report), /count/);
});

test("selected publishers derive equivalent coverage from combined JSON without changing native evidence", (t) => {
	const directory = fs.mkdtempSync(
		path.join(os.tmpdir(), "combined-coverage-"),
	);
	t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	const content = JSON.stringify(fixture());
	fs.writeFileSync(path.join(directory, "results.json"), content);
	const asset = {
		file: "results.json",
		format: "jest-json",
		sha256: Protocol.digest(content),
		sourceMap: { "index.js": "frontend/index.js" },
	};
	const native = new NativeReports();
	const expected = NativeReports.measurement(
		content,
		"jest-json",
		asset.sourceMap,
	);
	const publication = new CoveragePublication({
		directory,
		execute() {
			throw new Error("No project execution or converter installation");
		},
	});
	for (const reporter of ["github", "codecov", "coveralls"]) {
		const result = publication.prepare(
			{ id: reporter, assets: [asset], errors: [] },
			reporter,
		);
		const exported = fs.readFileSync(result.file, "utf8");
		const parsed = native.parse(exported, result.file, "coverage");
		assert.deepEqual(parsed.sourceFiles, ["frontend/index.js"]);
		assert.deepEqual(
			NativeReports.measurement(exported, result.format, {
				"frontend/index.js": "frontend/index.js",
			}),
			expected,
		);
		assert.equal(parsed.data.coverage.branches.total, 2);
	}
	assert.equal(
		fs.readFileSync(path.join(directory, "results.json"), "utf8"),
		content,
	);
});
