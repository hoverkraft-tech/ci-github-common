import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

const { CoverageReports } = await import(
	process.env.ACTION_ENTRYPOINT || "./CoverageReports.js"
);

import { CoberturaReport } from "./CoberturaReport.js";

const identity = {
	repository: "owner/repo",
	sha: "a".repeat(40),
	runId: "123",
	attempt: "2",
};
const xml = (file = "src/index.js", hits = 1, source = ".") =>
	`<coverage line-rate="${hits ? 1 : 0}"><sources><source>${source}</source></sources><packages><package name="fixture"><classes><class filename="${file}"><lines><line number="1" hits="${hits}"/></lines></class></classes></package></packages></coverage>`;

function fixture(t) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "coverage-reports-"));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const incoming = path.join(root, "incoming");
	fs.mkdirSync(incoming);
	const reports = new CoverageReports({ identity, temporaryDirectory: root });
	const prepare = (label, options = {}) => {
		const directory = path.join(root, label);
		fs.mkdirSync(path.join(directory, "src"), { recursive: true });
		fs.writeFileSync(
			path.join(directory, "src/index.js"),
			"export const value = 1;\n",
		);
		fs.writeFileSync(
			path.join(directory, "cobertura.xml"),
			xml("src/index.js", options.hits ?? 1),
		);
		const result = reports.prepare({
			directory,
			workspace: root,
			reports: [{ file: "cobertura.xml", language: "JavaScript", label }],
			group: "tests",
			sourceSha: identity.sha,
			sourcePrefix: label,
			...options,
		});
		const destination = path.join(incoming, result.name);
		fs.renameSync(result.directory, destination);
		return { ...result, directory: destination };
	};
	const collect = (labels, options = {}) =>
		reports.collect({
			directory: incoming,
			expected: labels.map((label) => ({ label, job: "tests" })),
			jobs: { tests: { result: "success" } },
			...options,
		});
	return { root, incoming, reports, prepare, collect };
}

test("independent components with identical report basenames survive collection and publication verification", (t) => {
	const f = fixture(t);
	const frontend = f.prepare("frontend", { hits: 0 });
	assert.equal(
		f.collect(["frontend"], { directory: frontend.directory }).reports[0].label,
		"frontend",
	);
	f.prepare("backend");
	const result = f.collect(["frontend", "backend"]);
	assert.deepEqual(
		result.reports.map((report) => report.label),
		["frontend", "backend"],
	);
	for (const selected of result.reports) {
		const verified = f.reports.verify({
			directory: result.directory,
			reports: [selected],
		});
		const report = fs.readFileSync(verified.file, "utf8");
		assert.deepEqual(new CoberturaReport(report).files(), [
			`${selected.label}/src/index.js`,
		]);
		if (selected.label === "frontend") assert.match(report, /hits="0"/);
		assert.doesNotMatch(report, new RegExp(f.root));
	}
	assert.throws(
		() =>
			f.reports.verify({
				directory: result.directory,
				reports: [{ ...result.reports[0], file: "../outside.xml" }],
			}),
		/does not match/,
	);
});

test("the expected inventory rejects missing, extra and duplicate reports and failed producers", (t) => {
	const f = fixture(t);
	f.prepare("frontend");
	assert.throws(
		() => f.collect(["frontend", "backend"]),
		/Missing coverage components: backend/,
	);
	assert.throws(() => f.collect(["backend"]), /Unexpected coverage component/);
	assert.throws(
		() => f.collect(["frontend", "frontend"]),
		/Duplicate expected/,
	);
	for (const result of ["failure", "skipped", "cancelled", "abandoned"]) {
		assert.throws(
			() => f.collect(["frontend"], { jobs: { tests: { result } } }),
			/did not succeed/,
		);
	}
	f.prepare("frontend");
	assert.throws(() => f.collect(["frontend"]), /Duplicate coverage component/);
});

test("collection rejects stale identities, modified contents and unsafe artifact files", (t) => {
	const f = fixture(t);
	const prepared = f.prepare("frontend");
	const manifestPath = path.join(prepared.directory, "manifest.json");
	const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	for (const [key, value] of Object.entries({
		repository: "other/repo",
		sha: "b".repeat(40),
		runId: "122",
		attempt: "1",
	})) {
		fs.writeFileSync(
			manifestPath,
			JSON.stringify({ ...manifest, identity: { ...identity, [key]: value } }),
		);
		assert.throws(
			() => f.collect(["frontend"]),
			/different repository, commit, run or attempt/,
		);
	}
	fs.writeFileSync(manifestPath, JSON.stringify(manifest));
	const file = path.join(prepared.directory, manifest.reports[0].file);
	const original = fs.readFileSync(file);
	fs.writeFileSync(file, xml());
	assert.throws(() => f.collect(["frontend"]), /checksum mismatch/);
	fs.writeFileSync(file, original);
	fs.renameSync(file, `${file}.original`);
	fs.symlinkSync(`${file}.original`, file);
	assert.throws(() => f.collect(["frontend"]), /regular files/);
});

test("overlapping source files require a framework merge before publication", (t) => {
	const f = fixture(t);
	f.prepare("unit", { sourcePrefix: "application" });
	f.prepare("integration", { sourcePrefix: "application" });
	assert.throws(
		() => f.collect(["unit", "integration"]),
		/Overlapping coverage.*Merge these reports/,
	);
});

test("normalization resolves Cobertura source roots and rejects missing or escaping paths", (t) => {
	const f = fixture(t);
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

test("prepare supports several explicitly labeled reports and rejects incomplete inputs", (t) => {
	const f = fixture(t);
	f.prepare("frontend");
	const directory = path.join(f.root, "frontend");
	const options = {
		directory,
		workspace: f.root,
		group: "tests",
		sourceSha: identity.sha,
		sourcePrefix: "frontend",
	};
	const entries = [
		{ file: "cobertura.xml", language: "JavaScript", label: "unit" },
		{ file: "cobertura.xml", language: "JavaScript", label: "integration" },
	];
	assert.equal(
		f.reports.prepare({ ...options, reports: entries }).reports.length,
		2,
	);
	assert.throws(
		() =>
			f.reports.prepare({
				...options,
				reports: [...entries, { ...entries[0] }],
			}),
		/Duplicate coverage label/,
	);
	for (const entry of [
		{ file: "missing.xml", language: "JavaScript" },
		{ file: "../outside.xml", language: "JavaScript" },
		{ file: "cobertura.xml" },
	]) {
		assert.throws(() => f.reports.prepare({ ...options, reports: [entry] }));
	}
	assert.throws(
		() =>
			f.reports.prepare({
				...options,
				sourceSha: "b".repeat(40),
				reports: [entries[0]],
			}),
		/PR head commit/,
	);
});

test("a real checkout's commit cannot be overridden with a claimed source SHA", (t) => {
	const f = fixture(t);
	execFileSync("git", ["init", "-q", f.root]);
	execFileSync("git", [
		"-C",
		f.root,
		"-c",
		"user.name=Fixture",
		"-c",
		"user.email=fixture@example.invalid",
		"-c",
		"commit.gpgsign=false",
		"commit",
		"--allow-empty",
		"-qm",
		"test: create fixture",
	]);
	assert.throws(() => f.prepare("frontend"), /PR head commit/);
	const sha = execFileSync("git", ["-C", f.root, "rev-parse", "HEAD"], {
		encoding: "utf8",
	}).trim();
	const reports = new CoverageReports({
		identity: { ...identity, sha },
		temporaryDirectory: f.root,
	});
	assert.throws(
		() =>
			reports.prepare({
				directory: path.join(f.root, "frontend"),
				workspace: f.root,
				sourcePrefix: "other",
				group: "tests",
				reports: [{ file: "cobertura.xml", language: "JavaScript" }],
			}),
		/actual checkout directory/,
	);
});
