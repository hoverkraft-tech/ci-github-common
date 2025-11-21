import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SummaryFormatter } from "./SummaryFormatter.js";
import {
  Coverage,
  LintIssue,
  ReportData,
  TestResult,
} from "../models/ReportData.js";

const buildReportData = () => {
  const reportData = new ReportData();
  reportData.addTest(
    new TestResult({
      name: "passes",
      status: "passed",
      suite: "suite a",
    }),
  );
  reportData.addTest(
    new TestResult({
      name: "fails",
      status: "failed",
      file: "src/sample.test.js",
      suite: "suite a",
      message: "Expected true to be false",
    }),
  );

  reportData.addLintIssue(
    new LintIssue({
      file: "src/app.js",
      line: 10,
      column: 2,
      severity: "error",
      rule: "no-undef",
      message: "foo is not defined",
    }),
  );

  reportData.setCoverage(
    new Coverage({
      lines: { total: 100, covered: 90, percentage: 90 },
      branches: { total: 50, covered: 35, percentage: 70 },
      functions: { total: 20, covered: 15, percentage: 75 },
      statements: { total: 0, covered: 0, percentage: 0 },
    }),
  );

  return reportData;
};

describe("SummaryFormatter", () => {
  it("renders sections tailored for the GitHub step summary", () => {
    const reportData = buildReportData();
    const formatter = new SummaryFormatter();

    const markdown = formatter.format(reportData, "CI Report");

    assert.match(markdown, /## CI Report/);
    assert.match(markdown, /### Test Results/);
    assert.match(markdown, /#### Failed Tests/);
    assert.match(markdown, /### Lint Issues/);
    assert.match(markdown, /#### Errors/);
    assert.match(markdown, /### Coverage Report/);
    assert.match(markdown, /Overall Coverage/);
    assert.doesNotMatch(markdown, /Passed Tests/);
  });

  it("includes passed tests section when requested", () => {
    const reportData = buildReportData();
    const formatter = new SummaryFormatter();

    const markdown = formatter.format(reportData, "CI Report", true);
    assert.match(markdown, /#### Passed Tests/);
    assert.match(markdown, /passes/);
  });
});
