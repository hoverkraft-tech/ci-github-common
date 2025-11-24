import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AstroCheckParser } from "./AstroCheckParser.js";

const SAMPLE_ERROR = `Getting diagnostics for Astro files in /repo...
\u001b[31msrc/pages/index.astro:4:7 - error TS2304: Cannot find name 'frontmatter'.\u001b[0m

4 | ---
        ~~~

Result (1 file):`;

const SAMPLE_WARNING = `C:/repo/src/components/Card.astro:12:2 - warning TS1000: Missing prop validation.`;

describe("AstroCheckParser", () => {
  it("identifies astro check diagnostics", () => {
    const parser = new AstroCheckParser();

    assert.ok(parser.canParse("astro-check.log", SAMPLE_ERROR));
    assert.ok(parser.canParse("diagnostics.txt", SAMPLE_WARNING));
    assert.ok(!parser.canParse("notes.txt", "No diagnostics here"));
  });

  it("parses file, position, severity, and rule codes", () => {
    const parser = new AstroCheckParser();

    const reportData = parser.parse(
      `${SAMPLE_ERROR}\n${SAMPLE_WARNING}`,
      "astro-check.log",
    );

    assert.strictEqual(reportData.lintIssues.length, 2);

    const [errorIssue, warningIssue] = reportData.lintIssues;

    assert.strictEqual(errorIssue.file, "src/pages/index.astro");
    assert.strictEqual(errorIssue.line, 4);
    assert.strictEqual(errorIssue.column, 7);
    assert.strictEqual(errorIssue.severity, "error");
    assert.strictEqual(errorIssue.rule, "TS2304");
    assert.strictEqual(errorIssue.message, "Cannot find name 'frontmatter'.");
    assert.strictEqual(errorIssue.source, "astro-check");

    assert.strictEqual(warningIssue.file, "C:/repo/src/components/Card.astro");
    assert.strictEqual(warningIssue.line, 12);
    assert.strictEqual(warningIssue.column, 2);
    assert.strictEqual(warningIssue.severity, "warning");
    assert.strictEqual(warningIssue.rule, "TS1000");
    assert.strictEqual(warningIssue.message, "Missing prop validation.");
  });
});
