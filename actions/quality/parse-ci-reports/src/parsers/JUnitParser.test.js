import assert from "node:assert";
import { describe, it, suite, test } from "node:test";
import { JUnitParser } from "./JUnitParser.js";

suite("Nested JUnit suites", () => {
	test("collects Node.js root testcases and nested suites without losing empty status elements", () => {
		const result = new JUnitParser().parse(`<testsuites>
      <testcase name="passes" file="src/index.test.js"/>
      <testcase name="fails"><failure/></testcase>
      <testcase name="errors"><error/></testcase>
      <testcase name="skips"><skipped/></testcase>
      <testsuite name="nested"><testcase name="nested pass"/></testsuite>
    </testsuites>`);
		assert.strictEqual(result.getTotalTests(), 5);
		assert.strictEqual(result.getPassedCount(), 2);
		assert.strictEqual(result.getFailedCount(), 2);
		assert.strictEqual(result.getSkippedCount(), 1);
		assert.strictEqual(result.tests[0].file, "src/index.test.js");
		assert.strictEqual(result.tests[4].suite, "nested");
	});

	test("collects leaf tests once across PHPUnit aggregate and sibling suites", () => {
		// Arrange
		const parser = new JUnitParser();
		const content = `<testsuites>
      <testsuite name="PHPUnit" tests="4" failures="1" skipped="1">
        <testsuite name="Unit" tests="3" failures="1">
          <testcase name="direct" time="0.1"/>
          <testsuite name="SampleTest" tests="2" failures="1">
            <testcase name="passes" file="tests/SampleTest.php" time="0.2"/>
            <testcase name="fails" file="tests/SampleTest.php" time="0.3">
              <failure type="AssertionError">Expected value differs</failure>
            </testcase>
          </testsuite>
        </testsuite>
        <testsuite name="Integration" tests="1" skipped="1">
          <testcase name="skips"><skipped message="Not available"/></testcase>
        </testsuite>
      </testsuite>
    </testsuites>`;

		// Act
		const result = parser.parse(content);

		// Assert
		assert.strictEqual(result.getTotalTests(), 4);
		assert.strictEqual(result.getPassedCount(), 2);
		assert.strictEqual(result.getFailedCount(), 1);
		assert.strictEqual(result.getSkippedCount(), 1);
		const failure = result.getFailedTests()[0];
		assert.strictEqual(failure.suite, "SampleTest");
		assert.strictEqual(failure.file, "tests/SampleTest.php");
		assert.strictEqual(failure.message, "Expected value differs");
		assert.strictEqual(failure.duration, 0.3);
	});
});

describe("JUnitParser", () => {
	const parser = new JUnitParser();

	it("should identify JUnit XML files", () => {
		const content = `<?xml version="1.0"?>
      <testsuite name="Test Suite">
        <testcase name="test1" />
      </testsuite>`;

		assert.strictEqual(parser.canParse("junit.xml", content), true);
		assert.strictEqual(parser.canParse("test-results.xml", content), true);
	});

	it("keeps auto-pattern path detection synchronized", () => {
		const filePath = "reports/junit-report.xml";
		const content = `<?xml version="1.0"?><testsuite name="suite"><testcase name="ok"/></testsuite>`;

		assert.ok(parser.matchesAutoPatterns(filePath));
		assert.ok(parser.canParse(filePath, content));
	});

	it("should parse simple JUnit XML", () => {
		const content = `<?xml version="1.0"?>
      <testsuite name="Test Suite" tests="3" failures="1" skipped="1">
        <testcase name="test1" classname="TestClass" time="0.5" />
        <testcase name="test2" classname="TestClass" time="0.3">
          <failure message="Assertion failed">Expected true but got false</failure>
        </testcase>
        <testcase name="test3" classname="TestClass" time="0.1">
          <skipped message="Not implemented" />
        </testcase>
      </testsuite>`;

		const result = parser.parse(content, "test.xml");

		assert.strictEqual(result.getTotalTests(), 3);
		assert.strictEqual(result.getPassedCount(), 1);
		assert.strictEqual(result.getFailedCount(), 1);
		assert.strictEqual(result.getSkippedCount(), 1);

		const failedTest = result.getFailedTests()[0];
		assert.strictEqual(failedTest.name, "test2");
		assert.strictEqual(failedTest.status, "failed");
		assert.strictEqual(failedTest.message, "Assertion failed");
	});

	it("should parse JUnit XML with errors", () => {
		const content = `<?xml version="1.0"?>
      <testsuite name="Test Suite">
        <testcase name="test1" classname="TestClass">
          <error message="NullPointerException" type="java.lang.NullPointerException">
            Stack trace here
          </error>
        </testcase>
      </testsuite>`;

		const result = parser.parse(content, "test.xml");

		assert.strictEqual(result.getTotalTests(), 1);
		assert.strictEqual(result.getFailedCount(), 1);

		const errorTest = result.getFailedTests()[0];
		assert.strictEqual(errorTest.status, "error");
		assert.strictEqual(errorTest.errorType, "java.lang.NullPointerException");
	});

	it("should parse multiple test suites", () => {
		const content = `<?xml version="1.0"?>
      <testsuites>
        <testsuite name="Suite1">
          <testcase name="test1" />
        </testsuite>
        <testsuite name="Suite2">
          <testcase name="test2" />
        </testsuite>
      </testsuites>`;

		const result = parser.parse(content, "test.xml");

		assert.strictEqual(result.getTotalTests(), 2);
		assert.strictEqual(result.getPassedCount(), 2);
	});
});
