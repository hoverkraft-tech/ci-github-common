import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Protocol } from "./Protocol.js";

const { Collector } = await import(
	process.env.ACTION_ENTRYPOINT || "./Collector.js"
);

function fixture(t, { coverage = false, combined = false } = {}) {
	const temporaryDirectory = fs.mkdtempSync(
		path.join(os.tmpdir(), "collector-test-"),
	);
	t.after(() =>
		fs.rmSync(temporaryDirectory, { recursive: true, force: true }),
	);
	const artifacts = [];
	const files = new Map();
	const sha = "a".repeat(40);
	const context = {
		repo: { owner: "owner", repo: "repo" },
		runId: 12,
		sha,
		payload: { repository: { id: 1 } },
	};
	const job = {
		id: 3,
		name: "Tests",
		html_url: "https://github.com/owner/repo/actions/runs/12/job/3",
	};
	const execution = {
		attempt: 1,
		select: async (registrations) => ({
			selected: registrations.map((registration) => ({ registration, job })),
			errors: [],
		}),
	};
	function add(name, assets) {
		const artifact = {
			id: artifacts.length + 1,
			name,
			expired: false,
			size_in_bytes: 1000,
			workflow_run: { id: 12, repository_id: 1 },
		};
		artifacts.push(artifact);
		files.set(artifact.id, assets);
	}
	const registration = {
		version: 2,
		id: randomUUID(),
		check: Protocol.definition({
			reports: combined
				? [
						{ kind: "test", pattern: "results.json" },
						{ kind: "coverage", pattern: "results.json" },
					]
				: [
						{
							kind: coverage ? "coverage" : "test",
							pattern: coverage ? "lcov.info" : "junit.xml",
						},
					],
		}),
		execution: {
			repository: "owner/repo",
			repositoryId: "1",
			runId: "12",
			attempt: 1,
			job,
		},
		source: { sha, kind: "branch" },
	};
	const content = combined
		? fs.readFileSync(
				new URL("./fixtures/jest-report.json", import.meta.url),
				"utf8",
			)
		: coverage
			? "SF:index.js\nDA:1,1\nend_of_record\n"
			: '<testsuite><testcase name="first"/></testsuite>';
	const asset = {
		file: combined
			? "reports/results.json"
			: coverage
				? "reports/lcov.info"
				: "reports/junit.xml",
		size: Buffer.byteLength(content),
		sha256: Protocol.digest(content),
		selector: registration.check.reports[0],
		format: combined ? "jest-json" : coverage ? "lcov" : "junit",
		sourceMap: coverage || combined ? { "index.js": "index.js" } : {},
		...(coverage ? { language: "JavaScript" } : {}),
	};
	const result = {
		version: 2,
		id: registration.id,
		registrationDigest: Protocol.digest(JSON.stringify(registration)),
		execution: registration.execution,
		source: registration.source,
		outcome: "success",
		errors: [],
		assets: combined
			? [
					asset,
					{
						...asset,
						selector: registration.check.reports[1],
						language: "JavaScript",
					},
				]
			: [asset],
	};
	add(`ci-report-v2-registration-${registration.id}`, {
		"registration.json": JSON.stringify(registration),
	});
	const addResult = () =>
		add(`ci-report-v2-result-${registration.id}`, {
			"result.json": JSON.stringify(result),
			[asset.file]: content,
		});
	const github = {
		rest: { actions: { listWorkflowRunArtifacts() {} } },
		paginate: async () => artifacts,
	};
	const client = {
		listArtifacts: async () => ({ artifacts }),
		downloadArtifact: async (id, options) => {
			for (const [name, content] of Object.entries(files.get(id))) {
				const destination = path.join(options.path, name);
				fs.mkdirSync(path.dirname(destination), { recursive: true });
				fs.writeFileSync(destination, content);
			}
			return { digestMismatch: false };
		},
	};
	const collector = new Collector({
		execution,
		github,
		context,
		artifacts: client,
		core: { setOutput() {}, info() {} },
		temporaryDirectory,
		token: "fixture",
	});
	return { collector, registration, result, addResult, artifacts, files };
}

test("collection reparses native evidence instead of trusting embedded findings", async (t) => {
	const f = fixture(t);
	f.result.assets[0].data = { tests: [{ name: "forged", status: "passed" }] };
	f.addResult();
	const { collection } = await f.collector.collect({
		jobs: { tests: { result: "success" } },
		reporters: { coverage: "" },
	});
	assert.equal(
		collection.checks[0].result.assets[0].data.tests[0].name,
		"first",
	);
	assert.deepEqual(collection.errors, []);
});

test("combined reports publish one coverage dataset and count each test once", async (t) => {
	const f = fixture(t, { combined: true });
	f.result.assets.push(structuredClone(f.result.assets[0]));
	f.addResult();
	const { collection, directory } = await f.collector.collect({
		jobs: { tests: { result: "success" } },
		reporters: { coverage: "comment" },
	});
	const result = collection.checks[0].result;
	assert.equal(result.assets.flatMap((asset) => asset.data.tests).length, 2);
	assert.match(result.errors.join("\n"), /Duplicate report aspect/);
	assert.equal(collection.datasets.length, 1);
	assert.deepEqual(collection.datasets[0].errors, []);
	assert.equal(
		collection.datasets[0].assets[0].data.coverage.lines.percentage,
		50,
	);
	assert.equal(new Set(result.assets.map((asset) => asset.file)).size, 1);
	assert.deepEqual(
		fs.readdirSync(path.dirname(path.join(directory, result.assets[0].file))),
		["results.json"],
	);
});

test("one registration without a result survives flat download and makes missing evidence visible", async (t) => {
	const f = fixture(t);
	const { collection } = await f.collector.collect({
		jobs: { tests: { result: "failure" } },
		reporters: {},
	});
	assert.match(collection.errors.join(" "), /did not retain its result/);
	assert.equal(collection.checks.length, 1);
});

test("missing promised files and modified native bytes cannot be disguised by empty producer errors", async (t) => {
	const f = fixture(t, { coverage: true });
	f.result.assets[0].sha256 = "0".repeat(64);
	f.addResult();
	const { collection } = await f.collector.collect({
		jobs: { tests: { result: "success" } },
		reporters: {},
	});
	assert.match(collection.checks[0].result.errors.join(" "), /integrity/);
	assert.match(collection.datasets[0].errors.join(" "), /missing/);
});

test("expired evidence and cancellation never become an empty successful collection", async (t) => {
	const f = fixture(t);
	f.artifacts[0].expired = true;
	await assert.rejects(
		f.collector.collect({
			jobs: { tests: { result: "success" } },
			reporters: {},
		}),
		/expired/,
	);
	await assert.rejects(
		f.collector.collect({
			jobs: { tests: { result: "cancelled" } },
			reporters: {},
		}),
		/cancellation/,
	);
});

test("independent coverage remains separate and overlapping primary sources require a provider merge", () => {
	const collector = new Collector({});
	const checks = ["frontend", "backend"].map((project, index) => ({
		id: String(index),
		source: { sha: "a".repeat(40), kind: "branch" },
		check: Protocol.definition({
			project,
			reports: [{ kind: "coverage", pattern: "lcov.info" }],
		}),
	}));
	for (const check of checks)
		check.result = {
			assets: [
				{
					selector: check.check.reports[0],
					format: "lcov",
					sourceMap: { "index.js": `${check.check.project}/index.js` },
					sha256: "a".repeat(64),
					language: "JavaScript",
					data: { coverage: { lines: { total: 10, covered: 5 } } },
				},
			],
		};
	const collection = { checks, errors: [] };
	collector.datasets(collection);
	assert.equal(collection.datasets.length, 2);
	assert.equal(collection.errors.length, 0);
	checks[1].result.assets[0].sourceMap["index.js"] = "frontend/index.js";
	collector.datasets(collection);
	assert.match(collection.errors.join(" "), /overlap/);
});
