import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

const { ReportBundle, ReportPlan } = await import(
	process.env.ACTION_ENTRYPOINT || "./index.js"
);

const identity = {
	repository: "owner/project",
	sha: "a".repeat(40),
	runId: "123",
	attempt: "2",
};
const xml =
	'<coverage line-rate="1"><sources><source>.</source></sources><packages><package name="fixture"><classes><class filename="index.js"><lines><line number="1" hits="1"/></lines></class></classes></package></packages></coverage>';

function fixture(t, producers) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "ci-report-bundle-"));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const incoming = path.join(root, "incoming");
	fs.mkdirSync(incoming);
	const bundle = new ReportBundle({ identity, temporaryDirectory: root });
	const { plan, selections } = bundle.plan({ producers });
	const jobs = {
		arbitraryCallerName: {
			result: "success",
			outputs: { "report-plan": JSON.stringify(plan) },
		},
	};
	const record = (key, options = {}) => {
		const producer = selections[key].producers[0];
		const directory = path.join(root, producer.directory);
		fs.mkdirSync(directory, { recursive: true });
		fs.writeFileSync(
			path.join(directory, "index.js"),
			"export const answer = 42;\n",
		);
		fs.writeFileSync(
			path.join(directory, "junit.xml"),
			'<testsuite><testcase name="example"/></testsuite>',
		);
		fs.writeFileSync(path.join(directory, "cobertura.xml"), xml);
		const result = bundle.record({
			directory,
			workspace: root,
			plan: selections[key],
			files: [
				path.join(directory, "junit.xml"),
				...(producer.coverage.length
					? [path.join(directory, "cobertura.xml")]
					: []),
			],
			sourceSha: identity.sha,
			sourcePrefix: producer.directory,
			...options,
		});
		const artifact = path.join(incoming, result.name);
		fs.renameSync(result.directory, artifact);
		return { ...result, directory: artifact };
	};
	return {
		root,
		incoming,
		bundle,
		plan,
		selections,
		jobs,
		record,
		collect: (options) =>
			bundle.collect({ directory: incoming, jobs, ...options }),
	};
}
const producer = (key, directory, coverage = true) => ({
	key,
	type: "test",
	directory,
	coverage: coverage ? [{ file: "cobertura.xml", language: "JavaScript" }] : [],
});

test("producer plans drive multi-component collection without caller job names or a repeated coverage inventory", (t) => {
	const f = fixture(t, [
		producer("test", "backend"),
		producer("test-node24", "frontend"),
		producer("test-node26", "frontend", false),
	]);
	for (const key of Object.keys(f.selections))
		assert.equal(f.record(key).complete, true);
	const result = f.collect({ provider: "github" });
	assert.equal(result.complete, true);
	assert.equal(result.collection.statuses.length, 3);
	assert.deepEqual(
		result.reports.map((report) => report.label),
		["backend", "frontend"],
	);
	assert.equal(
		result.collection.reportFiles.filter((file) => file.includes("/coverage/"))
			.length,
		2,
	);
	for (const report of result.reports)
		assert.ok(
			fs.existsSync(
				f.bundle.coverage.verify({
					directory: path.join(result.directory, "coverage"),
					reports: [report],
				}).file,
			),
		);
});

test("single artifact extraction and diagnostics-only producers work with the same bundle contract", (t) => {
	const f = fixture(t, [producer("test", ".project", false)]);
	const recorded = f.record("test");
	const result = f.collect({ directory: recorded.directory });
	assert.equal(result.complete, true);
	assert.deepEqual(result.reports, []);
	assert.equal(result.collection.reportFiles.length, 1);
	assert.equal(
		f.collect({ directory: recorded.directory, provider: "github" }).complete,
		false,
	);
});

test("missing matrix members and missing plan outputs fail completeness before publication", (t) => {
	const f = fixture(t, [
		producer("first", "backend"),
		producer("second", "frontend"),
	]);
	f.record("first");
	const missing = f.collect({ provider: "github" });
	assert.equal(missing.complete, false);
	assert.match(
		missing.collection.errors.join(" "),
		/Reports unavailable.*Rerun all/,
	);
	assert.deepEqual(missing.reports, []);
	const unmanaged = f.collect({
		jobs: { tests: { result: "success", outputs: {} } },
	});
	assert.match(unmanaged.collection.errors.join(" "), /no report-plan/);
	f.record("second");
	for (const result of ["failure", "cancelled", "skipped", "abandoned"]) {
		const failed = f.collect({
			jobs: { arbitraryCallerName: { ...f.jobs.arbitraryCallerName, result } },
		});
		assert.equal(failed.complete, false);
		assert.ok(failed.collection.reportFiles.length > 0);
		assert.deepEqual(failed.reports, []);
	}
});

test("an outer matrix forwards its complete pre-execution plan from configuration, including missing invocations", (t) => {
	const f = fixture(t, [
		{ ...producer("backend", "backend"), job: "matrix" },
		{ ...producer("frontend", "frontend"), job: "matrix" },
	]);
	const jobs = {
		configuration: {
			result: "success",
			outputs: { "report-plan": JSON.stringify(f.plan) },
		},
		matrix: { result: "success", outputs: {} },
	};
	assert.equal(
		ReportPlan.selections(f.selections.backend).test.producers[0].key,
		"backend",
	);
	f.record("backend");
	assert.equal(f.collect({ jobs }).complete, false);
	f.record("frontend");
	assert.equal(f.collect({ jobs }).complete, true);
	assert.throws(
		() =>
			new ReportPlan(f.bundle.planIdentity).fromJobs(
				{ configuration: jobs.configuration },
				f.bundle.planIdentity,
			),
		/absent from job-results/,
	);
});

test("invalid coverage and corrupted bundles retain independent test diagnostics without allowing publication", (t) => {
	const f = fixture(t, [
		producer("backend", "backend"),
		producer("frontend", "frontend"),
	]);
	const first = f.record("backend", { sourceSha: "b".repeat(40) });
	assert.equal(first.complete, false);
	f.record("frontend");
	let result = f.collect();
	assert.equal(result.complete, false);
	assert.equal(
		result.collection.reportFiles.filter((file) => file.endsWith("junit.xml"))
			.length,
		2,
	);
	const manifest = JSON.parse(
		fs.readFileSync(path.join(first.directory, "ci-report.json")),
	);
	fs.writeFileSync(
		path.join(first.directory, manifest.files[0].file),
		"modified",
	);
	result = f.collect();
	assert.match(result.collection.errors.join(" "), /checksum/);
	assert.ok(
		result.collection.reportFiles.some((file) => file.includes("frontend")),
	);
});

test("plans reject stale attempts and invalid producer definitions before tool execution", (t) => {
	const f = fixture(t, [producer("test", "project")]);
	assert.throws(
		() =>
			f.bundle.plan({
				plan: { ...f.plan, identity: { ...f.plan.identity, attempt: "1" } },
			}),
		/different repository, run or attempt/,
	);
	for (const definitions of [
		[producer("same", "a"), producer("same", "b")],
		[producer("test", "../escape")],
		[{ ...producer("test", "project"), label: "safe/../../escape" }],
		[
			{
				...producer("test", "a"),
				coverage: [{ file: "../escape", language: "Go" }],
			},
		],
	]) {
		assert.throws(() => f.bundle.plan({ producers: definitions }));
	}
	assert.throws(
		() =>
			new ReportPlan(f.bundle.planIdentity).fromJobs(
				{ tests: { result: "running" } },
				f.bundle.planIdentity,
			),
		/completed job results/,
	);
});

test("outer reusable workflow matrices retain every invocation despite GitHub forwarding only the last output", (t) => {
	const f = fixture(t, [{ ...producer("test", "backend"), job: "matrix" }]);
	const second = f.bundle.plan({
		producers: [{ ...producer("test", "frontend"), job: "matrix" }],
	}).plan;
	const jobs = {
		configuration: {
			result: "success",
			outputs: { "report-plan": JSON.stringify([f.plan, second]) },
		},
		matrix: {
			result: "success",
			outputs: { "report-plan": JSON.stringify(f.plan) },
		},
	};
	f.record("test");
	assert.equal(f.bundle.discover({ jobs }).count, 2);
	assert.equal(f.collect({ jobs }).complete, false);
	const definitions = new ReportPlan(f.bundle.planIdentity).fromJobs(jobs);
	assert.equal(definitions.size, 2);
});

test("empty test execution is incomplete, and duplicate coverage formats remain attachments", (t) => {
	const f = fixture(t, [producer("test", "project")]);
	const empty = f.record("test", { testCount: "0" });
	assert.equal(empty.complete, false);
	assert.match(empty.errors.join(" "), /No executed tests/);
	const root = path.join(f.root, "project");
	const lcov = path.join(root, "lcov.info");
	fs.writeFileSync(lcov, "SF:index.js\nDA:1,1\nend_of_record\n");
	const recorded = f.bundle.record({
		directory: root,
		workspace: f.root,
		plan: f.selections.test,
		sourceSha: identity.sha,
		sourcePrefix: "project",
		testCount: "1",
		files: [path.join(root, "junit.xml"), lcov],
		categories: [{ file: lcov, type: "coverage" }],
	});
	assert.equal(recorded.complete, true);
	const manifest = JSON.parse(
		fs.readFileSync(path.join(recorded.directory, "ci-report.json")),
	);
	assert.equal(
		manifest.files.filter((file) => file.type === "coverage").length,
		1,
	);
	assert.equal(
		manifest.files.filter((file) => file.type === "attachment").length,
		1,
	);
});
