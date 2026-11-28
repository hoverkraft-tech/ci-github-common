import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { CoberturaReport } from "./CoberturaReport.js";

const xml = (file = "src/index.js", hits = 1, source = ".") =>
	`<coverage line-rate="${hits ? 1 : 0}"><sources><source>${source}</source></sources><packages><package name="fixture"><classes><class filename="${file}"><lines><line number="1" hits="${hits}"/></lines></class></classes></package></packages></coverage>`;

test("normalization resolves Cobertura source roots and rejects missing or escaping paths", (t) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "cobertura-test-"));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const f = { root };
	const project = path.join(f.root, "backend");
	fs.mkdirSync(path.join(project, "src"), { recursive: true });
	fs.writeFileSync(path.join(project, "src/app.py"), "value = 1\n");
	fs.writeFileSync(path.join(project, "app.py"), "value = 2\n");
	fs.writeFileSync(path.join(f.root, "app.py"), "value = 3\n");
	const report = new CoberturaReport(
		xml("app.py", 1, path.join(project, "src")).replace(
			'hits="1"',
			'hits="1" branch="true" condition-coverage="100% (2/2)"',
		),
	);
	const normalized = report.normalize({
		project,
		repository: f.root,
		prefix: "backend",
	});
	assert.deepEqual(new CoberturaReport(normalized).files(), [
		"backend/src/app.py",
	]);
	assert.throws(
		() =>
			new CoberturaReport(xml("missing.py")).normalize({
				project,
				repository: f.root,
				prefix: "backend",
			}),
		/exactly one/,
	);
	assert.throws(
		() => new CoberturaReport(xml("../outside.py")).files(),
		/repository-relative/,
	);
	for (const content of [
		"not xml",
		'<coverage line-rate="1"/>',
		xml().replace('hits="1"', 'hits="-1"'),
		`<!DOCTYPE coverage [<!ENTITY x "data">]>${xml()}`,
	]) {
		assert.throws(() => new CoberturaReport(content));
	}
});
