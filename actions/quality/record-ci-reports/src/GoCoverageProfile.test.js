import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { CoveragePublication } from "./CoveragePublication.js";
import { GoCoverageProfile } from "./GoCoverageProfile.js";
import { NativeReports } from "./NativeReports.js";
import { Protocol } from "./Protocol.js";

const profile =
	"mode: atomic\nexample.org/owner/module/main.go:3.1,5.2 3 2\nexample.org/owner/module/main.go:6.1,6.8 1 0\n";

test("native Go statements remain distinct from line-oriented destination measurements", () => {
	const native = new NativeReports().parse(profile, "coverage.out", "coverage");
	assert.equal(native.format, "golang");
	assert.deepEqual(native.data.coverage.statements, {
		total: 4,
		covered: 3,
		percentage: 75,
	});
	assert.equal(native.data.coverage.metric, "statements");
	const moreLines = new GoCoverageProfile(
		profile.replace("3.1,5.2", "1.1,5.2"),
	).native();
	assert.equal(moreLines.data.coverage.statements.percentage, 75);
	assert.notEqual(moreLines.data.coverage.lines.percentage, 75);
});

test("Go coverage rejects malformed, conflicting and oversized measurements and merges repeated blocks", () => {
	for (const bad of [
		"mode: invalid\n",
		profile.replace("3.1,5.2", "5.1,3.2"),
		profile.replace("3.1,5.2", "3.1,1000002.2"),
		profile.replace("3 2", "3 -1"),
		profile.replace("3 2", "3 9007199254740992"),
	])
		assert.throws(() => new GoCoverageProfile(bad));
	const block = profile.split("\n")[1];
	assert.equal(
		new GoCoverageProfile(`${profile}${block}\n`).statements.total,
		4,
	);
	assert.throws(
		() => new GoCoverageProfile(`${profile}${block.replace("3 2", "4 2")}\n`),
		/Conflicting/,
	);
});

test("publication normalizes Go paths only for the selected destination and preserves the native bytes", (t) => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "native-go-"));
	t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	fs.writeFileSync(path.join(directory, "coverage.out"), profile);
	const asset = {
		file: "coverage.out",
		format: "golang",
		sha256: Protocol.digest(profile),
		sourceMap: { "example.org/owner/module/main.go": "services/api/main.go" },
	};
	const publication = new CoveragePublication({
		directory,
		execute() {
			throw new Error("No converter installation for LCOV destinations");
		},
	});
	for (const reporter of ["codecov", "coveralls"]) {
		const result = publication.prepare(
			{ id: reporter, assets: [asset], errors: [] },
			reporter,
		);
		assert.equal(result.format, "lcov");
		assert.match(
			fs.readFileSync(result.file, "utf8"),
			/^SF:services\/api\/main.go\nDA:3,2\nDA:4,2\nDA:5,2\nDA:6,0\n/,
		);
	}
	assert.equal(
		fs.readFileSync(path.join(directory, "coverage.out"), "utf8"),
		profile,
	);
	const measurement = NativeReports.measurement(
		profile,
		"golang",
		asset.sourceMap,
	);
	assert.deepEqual(measurement.lines, { total: 4, covered: 3, percentage: 75 });
});

test("module-prefixed profiles resolve to the declared repository project", (t) => {
	const workspace = fs.mkdtempSync(
		path.join(os.tmpdir(), "go-source-mapping-"),
	);
	t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
	fs.mkdirSync(path.join(workspace, "services/api"), { recursive: true });
	fs.mkdirSync(path.join(workspace, "reports"));
	fs.writeFileSync(
		path.join(workspace, "services/api/main.go"),
		"package main\n",
	);
	fs.writeFileSync(path.join(workspace, "reports/coverage.out"), profile);
	const result = new NativeReports().validate(
		path.join(workspace, "reports"),
		{
			project: "services/api",
			"path-mapping": { "example.org/owner/module": "services/api" },
			reports: [{ kind: "coverage", pattern: "coverage.out", language: "Go" }],
		},
		workspace,
	);
	assert.deepEqual(result.errors, []);
	assert.equal(
		result.assets[0].sourceMap["example.org/owner/module/main.go"],
		"services/api/main.go",
	);
	assert.equal(result.assets[0].data.coverage.metric, "statements");
});
