import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { CoverageBaseline } from "./CoverageBaseline.js";
import { CoveragePublication } from "./CoveragePublication.js";
import { NativeReports } from "./NativeReports.js";
import { Protocol } from "./Protocol.js";

test("native normalization keeps zero coverage, source mapping and original bytes intact", (t) => {
	const directory = fs.mkdtempSync(
		path.join(os.tmpdir(), "coverage-publication-"),
	);
	t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	const content = "SF:src/index.js\nDA:1,0\nLF:1\nLH:0\nend_of_record\n";
	fs.writeFileSync(path.join(directory, "lcov.info"), content);
	const asset = {
		file: "lcov.info",
		format: "lcov",
		sha256: Protocol.digest(content),
		sourceMap: { "src/index.js": "frontend/src/index.js" },
	};
	const publication = new CoveragePublication({
		directory,
		execute: () => {
			throw new Error("Unexpected converter installation");
		},
	});
	const result = publication.prepare(
		{ id: "example", assets: [asset], errors: [] },
		"codecov",
	);
	assert.match(
		fs.readFileSync(result.file, "utf8"),
		/SF:frontend\/src\/index.js\nDA:1,0/,
	);
	assert.equal(
		fs.readFileSync(path.join(directory, "lcov.info"), "utf8"),
		content,
	);
	fs.writeFileSync(
		path.join(directory, "lcov.info"),
		content.replace("1,0", "1,1"),
	);
	assert.throws(
		() =>
			publication.prepare(
				{ id: "example", assets: [asset], errors: [] },
				"codecov",
			),
		/changed/,
	);
});

test("coverage validation accepts ordinary Cobertura DTD metadata and rejects entities and invalid LCOV counts", () => {
	const native = new NativeReports();
	const xml =
		'<coverage line-rate="1"><packages><package><classes><class filename="index.js"><lines><line number="1" hits="1"/></lines></class></classes></package></packages></coverage>';
	assert.equal(
		native.parse(
			`<!DOCTYPE coverage SYSTEM "https://example.invalid/coverage.dtd">${xml}`,
			"coverage.xml",
			"coverage",
		).data.coverage.lines.total,
		1,
	);
	assert.throws(
		() =>
			native.parse(
				`<!DOCTYPE coverage [<!ENTITY secret "x">]>${xml}`,
				"coverage.xml",
				"coverage",
			),
		/unsafe/,
	);
	assert.throws(
		() =>
			native.parse(
				"SF:index.js\nDA:1,-2\nend_of_record\n",
				"lcov.info",
				"coverage",
			),
		/Invalid/,
	);
});

test("baselines require equivalent dataset meaning and runtime, without synthesizing a comparison", () => {
	const current = {
		label: "api/unit",
		project: "api",
		language: "Python",
		role: "primary",
		checkId: "current",
		assets: [{ format: "cobertura" }],
	};
	const previous = { ...current, checkId: "base", errors: [] };
	const check = { id: "current", check: { variant: { runtime: "3.14" } } };
	const base = {
		id: "base",
		check: { variant: { runtime: "3.14" } },
		result: { outcome: "success", errors: [] },
	};
	assert.equal(
		CoverageBaseline.comparable(current, previous, [check], [base]),
		true,
	);
	base.check.variant.runtime = "3.13";
	assert.equal(
		CoverageBaseline.comparable(current, previous, [check], [base]),
		false,
	);
});

test("alternative formats must cover the same lines, not merely have the same percentage", () => {
	const sourceMap = { "index.js": "frontend/index.js" };
	const lcov = NativeReports.measurement(
		"SF:index.js\nDA:1,4\nDA:2,0\nend_of_record\n",
		"lcov",
		sourceMap,
	);
	const xml =
		'<coverage line-rate="0.5"><packages><package><classes><class filename="index.js"><lines><line number="1" hits="1"/><line number="2" hits="0"/></lines></class></classes></package></packages></coverage>';
	const equivalent = NativeReports.measurement(xml, "cobertura", sourceMap);
	const different = NativeReports.measurement(
		xml
			.replace('number="1" hits="1"', 'number="1" hits="0"')
			.replace('number="2" hits="0"', 'number="2" hits="1"'),
		"cobertura",
		sourceMap,
	);
	assert.equal(lcov.measurementDigest, equivalent.measurementDigest);
	assert.deepEqual(lcov.lines, different.lines);
	assert.notEqual(lcov.measurementDigest, different.measurementDigest);
});
