import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MarkdownFormatter } from "./MarkdownFormatter.js";
import {
  Coverage,
  LintIssue,
  ReportData,
  TestResult,
} from "../models/ReportData.js";

describe("MarkdownFormatter", () => {
  it("renders structured sections for tests, lint, and coverage", () => {
    const reportData = new ReportData();
    reportData.addTest(new TestResult({ name: "passes", status: "passed" }));
    reportData.addTest(
      new TestResult({
        name: "fails",
        status: "failed",
        message: "Expected true to be false",
        file: "src/sample.test.js",
        suite: "suite A",
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
    reportData.addLintIssue(
      new LintIssue({
        file: "src/app.js",
        line: 20,
        column: 4,
        severity: "warning",
        rule: "no-console",
        message: "Unexpected console statement",
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

    const formatter = new MarkdownFormatter();
    const markdown = formatter.format(reportData, "CI Report");

    assert.match(markdown, /## CI Report/);
    assert.match(markdown, /### Test Results/);
    assert.match(markdown, /\| Status \| Count \|/);
    assert.match(markdown, /<summary>Failed Tests<\/summary>/);
    assert.match(markdown, /### Lint Checks/);
    assert.match(markdown, /\| Severity \| Count \|/);
    assert.match(markdown, /<summary>Errors<\/summary>/);
    assert.match(markdown, /### Coverage/);
    assert.match(markdown, /Overall:/);
  });

  it("limits failed test details to five entries", () => {
    const reportData = new ReportData();
    for (let i = 0; i < 7; i += 1) {
      reportData.addTest(
        new TestResult({
          name: `failing-${i}`,
          status: "failed",
          message: "boom",
        }),
      );
    }

    const formatter = new MarkdownFormatter();
    const markdown = formatter.format(reportData, "Overflow Report");

    const occurrences = (markdown.match(/\*\*failing/g) || []).length;
    assert.strictEqual(occurrences, 5);
    assert.match(markdown, /\.\.\. and 2 more failures/);
  });
});
