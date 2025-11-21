import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrettierParser } from "./PrettierParser.js";

const SAMPLE_FAILURE_LOG = `Checking formatting...
[warn] src/app.js
[warn] src/components/Button.tsx
[warn] Code style issues found in the above file(s). Forgot to run Prettier?`;

const SAMPLE_ERROR_LOG = `Checking formatting...
[error] src/app.js: SyntaxError: Unexpected token (1:7)
[warn] Code style issues found in the above file(s). Forgot to run Prettier?`;

describe("PrettierParser", () => {
  it("identifies prettier check logs", () => {
    const parser = new PrettierParser();

    assert.ok(parser.canParse("prettier-check.log", SAMPLE_FAILURE_LOG));
    assert.ok(parser.canParse("logs/output.txt", SAMPLE_FAILURE_LOG));
  });

  it("parses files reported by prettier", () => {
    const parser = new PrettierParser();

    const reportData = parser.parse(SAMPLE_FAILURE_LOG, "prettier-check.log");
    assert.strictEqual(reportData.lintIssues.length, 2);
    assert.strictEqual(reportData.lintIssues[0].file, "src/app.js");
    assert.strictEqual(reportData.lintIssues[0].severity, "error");
    assert.strictEqual(
      reportData.lintIssues[0].message,
      "File is not formatted according to Prettier",
    );
  });

  it("captures error details when prettier reports syntax issues", () => {
    const parser = new PrettierParser();

    const reportData = parser.parse(SAMPLE_ERROR_LOG, "prettier.log");
    assert.strictEqual(reportData.lintIssues.length, 1);
    assert.strictEqual(reportData.lintIssues[0].file, "src/app.js");
    assert.strictEqual(
      reportData.lintIssues[0].message,
      "SyntaxError: Unexpected token (1:7)",
    );
  });
});
