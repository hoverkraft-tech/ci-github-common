import { describe, it } from "node:test";
import assert from "node:assert";
import { JUnitParser } from "./JUnitParser.js";

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
