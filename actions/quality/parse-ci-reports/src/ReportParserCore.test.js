import assert from "node:assert/strict";
import { describe, it, suite, test } from "node:test";
import { ReportParserCore } from "./ReportParserCore.js";

const sampleJUnit = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Sample" tests="1" failures="0">
  <testcase name="works" classname="SampleTest"/>
</testsuite>`;

const junitWithFile = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Sample" tests="1" failures="0">
  <testcase name="rewritten" classname="SampleTest" file="/app/src/tests/spec.js"/>
</testsuite>`;

describe("ReportParserCore", () => {
	it("reads files through the provided file system service", () => {
		const readCalls = [];
		const fakeFileSystem = {
			readFile(filePath) {
				readCalls.push(filePath);
				return sampleJUnit;
			},
		};
		const logger = { info() {} };

		const core = new ReportParserCore(fakeFileSystem, logger);
		const data = core.parseReports(["/tmp/results/junit.xml"]);

		assert.deepStrictEqual(readCalls, ["/tmp/results/junit.xml"]);
		assert.strictEqual(data.getTotalTests(), 1);
		assert.strictEqual(data.getFailedCount(), 0);
	});

	it("applies path rewriting when configured", () => {
		const fakeFileSystem = {
			readFile() {
				return junitWithFile;
			},
		};
		const logger = { info() {} };

		const core = new ReportParserCore(
			fakeFileSystem,
			logger,
			"/app/src:/home/runner/work/src",
		);

		const data = core.parseReports(["/app/src/tests/junit.xml"]);

		const firstTest = data.tests[0];
		assert.strictEqual(firstTest.file, "/home/runner/work/src/tests/spec.js");
	});
});

suite("Consolidated reports", () => {
	test("preserves separate package coverage and separates test and coverage Markdown", () => {
		// Arrange
		const reports = {
			"/reports/frontend/lcov.info":
				"SF:src/index.js\nDA:1,1\nDA:2,0\nLF:2\nLH:1\nend_of_record\n",
			"/reports/backend/lcov.info":
				"SF:src/index.js\nDA:1,1\nLF:1\nLH:1\nend_of_record\n",
			"/reports/tests/junit.xml": sampleJUnit,
		};
		const parser = new ReportParserCore(
			{ workingDirectory: "/reports", readFile: (file) => reports[file] },
			{ info() {} },
		);

		// Act
		const data = parser.parseReports(Object.keys(reports));
		const output = parser.generateOutput(data, "CI", false, "markdown,summary");

		// Assert
		assert.equal(data.coverage, null);
		assert.equal(data.coverageReports.length, 2);
		for (const text of [
			output.markdown,
			output.summary,
			output.coverageMarkdown,
		]) {
			assert.match(text, /frontend\/lcov/);
			assert.match(text, /backend\/lcov/);
			assert.match(text, /50\.00%/);
			assert.match(text, /100\.00%/);
		}
		assert.match(output.testMarkdown, /Test Results/);
		assert.doesNotMatch(output.testMarkdown, /Coverage/);
		assert.doesNotMatch(output.coverageMarkdown, /Test Results/);
	});

	test("shows failed suites first and leaves absent coverage empty", () => {
		// Arrange
		const xml =
			'<testsuites><testsuite name="Passing"><testcase name="ok"/></testsuite><testsuite name="Failing"><testcase name="broken"><failure message="expected failure"/></testcase></testsuite></testsuites>';
		const parser = new ReportParserCore({ readFile: () => xml }, { info() {} });

		// Act
		const data = parser.parseReports(["junit.xml"]);
		const output = parser.generateOutput(data, "CI", false, "markdown");

		// Assert
		assert.equal(data.hasErrors(), true);
		assert.equal(output.coverageMarkdown, "");
		assert.ok(
			output.testMarkdown.indexOf("| Failing |") <
				output.testMarkdown.indexOf("| Passing |"),
		);
		assert.match(output.testMarkdown, /expected failure/);
	});
});

suite("Compact category comments", () => {
	test("keeps counts visible and collapses diagnostics for each report type", () => {
		// Arrange
		const files = {
			"/reports/junit.xml":
				'<testsuite name="checks"><testcase name="fails"><failure message="failed check"/></testcase></testsuite>',
			"/reports/eslint.json": JSON.stringify([
				{
					filePath: "src/example.js",
					messages: [
						{ severity: 2, ruleId: "error-rule", message: "lint error" },
						{ severity: 1, ruleId: "warning-rule", message: "lint warning" },
					],
				},
			]),
			"/reports/lcov.info":
				"SF:src/example.js\nDA:1,1\nLF:1\nLH:1\nend_of_record\n",
		};
		const parser = new ReportParserCore(
			{ workingDirectory: "/reports", readFile: (file) => files[file] },
			{ info() {} },
		);

		// Act
		const output = parser.generateOutput(
			parser.parseReports(Object.keys(files)),
			"CI",
			false,
			"markdown",
		);

		// Assert
		assert.match(
			output.testMarkdown.split("\n")[0],
			/0 passed · 1 failed · 0 skipped/,
		);
		assert.match(
			output.lintMarkdown.split("\n")[0],
			/1 errors · 1 warnings in 1 diagnostic report/,
		);
		assert.match(output.coverageMarkdown.split("\n")[0], /1 source report/);
		for (const text of [
			output.testMarkdown,
			output.lintMarkdown,
			output.coverageMarkdown,
		]) {
			assert.match(text, /<details>\n<summary>.* details<\/summary>/);
			assert.doesNotMatch(text, /<details[^>]*open/);
			assert.equal(
				(text.match(/<details>/g) || []).length,
				(text.match(/<\/details>/g) || []).length,
			);
			assert.ok(text.indexOf("<details>") < text.indexOf("|"));
		}
		assert.match(output.lintMarkdown, /lint error/);
		assert.match(output.lintMarkdown, /lint warning/);
		assert.doesNotMatch(output.lintMarkdown, /Test Results|Coverage/);
		assert.doesNotMatch(output.testMarkdown, /lint error/);
	});

	test("distinguishes clean lint reports from missing lint reports", () => {
		// Arrange
		const parser = new ReportParserCore(
			{ readFile: () => '[{"filePath":"src/example.js","messages":[]}]' },
			{ info() {} },
		);

		// Act
		const clean = parser.generateOutput(
			parser.parseReports(["eslint.json"]),
			"CI",
			false,
			"markdown",
		);
		const missing = parser.generateOutput(
			parser.parseReports([]),
			"CI",
			false,
			"markdown",
		);

		// Assert
		assert.match(
			clean.lintMarkdown,
			/0 errors · 0 warnings in 1 diagnostic report/,
		);
		assert.equal(clean.testMarkdown, "");
		assert.equal(clean.coverageMarkdown, "");
		assert.equal(missing.lintMarkdown, "");
	});
});

const noopFs = { readFile: () => "" };

describe("ReportParserCore.parseOutputFormats", () => {
	it("returns every output when 'all' is provided", () => {
		const logger = { info() {} };
		const core = new ReportParserCore(noopFs, logger);
		assert.deepStrictEqual(core.parseOutputFormats("all"), [
			"summary",
			"markdown",
			"annotations",
		]);
	});

	it("splits comma-separated values and trims whitespace", () => {
		const logger = { info() {} };
		const core = new ReportParserCore(noopFs, logger);
		assert.deepStrictEqual(
			core.parseOutputFormats(" summary , markdown ,annotations "),
			["summary", "markdown", "annotations"],
		);
	});
});
