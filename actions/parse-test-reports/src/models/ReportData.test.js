import { describe, it } from "node:test";
import assert from "node:assert";
import { TestResult, LintIssue, Coverage, ReportData } from "./ReportData.js";

describe("TestResult", () => {
  it("should identify passed tests", () => {
    const test = new TestResult({ name: "test1", status: "passed" });
    assert.strictEqual(test.isPassed(), true);
    assert.strictEqual(test.isFailed(), false);
    assert.strictEqual(test.isSkipped(), false);
  });

  it("should identify failed tests", () => {
    const test = new TestResult({ name: "test1", status: "failed" });
    assert.strictEqual(test.isPassed(), false);
    assert.strictEqual(test.isFailed(), true);
    assert.strictEqual(test.isSkipped(), false);
  });

  it("should identify error tests as failed", () => {
    const test = new TestResult({ name: "test1", status: "error" });
    assert.strictEqual(test.isFailed(), true);
  });

  it("should identify skipped tests", () => {
    const test = new TestResult({ name: "test1", status: "skipped" });
    assert.strictEqual(test.isSkipped(), true);
  });
});

describe("LintIssue", () => {
  it("should identify errors", () => {
    const issue = new LintIssue({
      file: "test.js",
      line: 1,
      column: 1,
      severity: "error",
      rule: "no-unused-vars",
      message: "Variable is not used",
    });
    assert.strictEqual(issue.isError(), true);
    assert.strictEqual(issue.isWarning(), false);
  });

  it("should identify warnings", () => {
    const issue = new LintIssue({
      file: "test.js",
      line: 1,
      column: 1,
      severity: "warning",
      rule: "no-console",
      message: "Unexpected console",
    });
    assert.strictEqual(issue.isError(), false);
    assert.strictEqual(issue.isWarning(), true);
  });
});

describe("Coverage", () => {
  it("should calculate overall percentage from lines", () => {
    const coverage = new Coverage({
      lines: { total: 100, covered: 80, percentage: 80 },
    });
    assert.strictEqual(coverage.getOverallPercentage(), 80);
  });

  it("should handle zero coverage", () => {
    const coverage = new Coverage({
      lines: { total: 100, covered: 0, percentage: 0 },
    });
    assert.strictEqual(coverage.getOverallPercentage(), 0);
  });
});

describe("ReportData", () => {
  it("should aggregate test results", () => {
    const data = new ReportData();
    data.addTest(new TestResult({ name: "test1", status: "passed" }));
    data.addTest(new TestResult({ name: "test2", status: "failed" }));
    data.addTest(new TestResult({ name: "test3", status: "skipped" }));

    assert.strictEqual(data.getTotalTests(), 3);
    assert.strictEqual(data.getPassedCount(), 1);
    assert.strictEqual(data.getFailedCount(), 1);
    assert.strictEqual(data.getSkippedCount(), 1);
  });

  it("should aggregate lint issues", () => {
    const data = new ReportData();
    data.addLintIssue(createLintIssue("error", "rule1", "Error"));
    data.addLintIssue(createLintIssue("warning", "rule2", "Warning", 2));

    assert.strictEqual(data.lintIssues.length, 2);
    assert.strictEqual(data.getErrors().length, 1);
    assert.strictEqual(data.getWarnings().length, 1);
  });

  it("should detect errors", () => {
    const data = new ReportData();
    assert.strictEqual(data.hasErrors(), false);

    data.addTest(new TestResult({ name: "test1", status: "failed" }));
    assert.strictEqual(data.hasErrors(), true);
  });

  it("should detect lint errors", () => {
    const data = new ReportData();
    const errorIssue = createLintIssue("error", "rule1", "Error");
    data.addLintIssue(errorIssue);
    assert.strictEqual(data.hasErrors(), true);
  });
});

function createLintIssue(severity, rule, message, line = 1) {
  return new LintIssue({
    file: "test.js",
    line,
    column: 1,
    severity,
    rule,
    message,
  });
}
