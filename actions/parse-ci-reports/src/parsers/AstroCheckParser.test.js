import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AstroCheckParser } from "./AstroCheckParser.js";

const SAMPLE_ERROR = `Getting diagnostics for Astro files in /repo...
\u001b[31msrc/pages/index.astro:4:7 - error TS2304: Cannot find name 'frontmatter'.\u001b[0m

4 | ---
        ~~~

Result (1 file):`;

const SAMPLE_WARNING = `C:/repo/src/components/Card.astro:12:2 - warning TS1000: Missing prop validation.`;
const SAMPLE_ERROR_NO_HYPHEN = `src/components/Widget.astro:5:9 error TS1234: Some issue without hyphen.`;
const SAMPLE_EMPTY_REPORT = `08:37:09 [vite] Re-optimizing dependencies because vite config has changed
08:37:09 [content] Syncing content
08:37:09 [content] Synced content
08:37:09 [types] Generated 77ms
08:37:09 [check] Getting diagnostics for Astro files in /repo...
Result (26 files): 
- 0 errors
- 0 warnings
- 0 hints`;

describe("AstroCheckParser", () => {
  it("identifies astro check diagnostics", () => {
    const parser = new AstroCheckParser();

    assert.ok(parser.canParse("astro-check.log", SAMPLE_ERROR));
    assert.ok(parser.canParse("diagnostics.txt", SAMPLE_WARNING));
    assert.ok(parser.canParse("no-hyphen.log", SAMPLE_ERROR_NO_HYPHEN));
    assert.ok(parser.canParse("empty.log", SAMPLE_EMPTY_REPORT));
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

  it("parses diagnostics that omit the hyphen separator", () => {
    const parser = new AstroCheckParser();

    const reportData = parser.parse(SAMPLE_ERROR_NO_HYPHEN, "astro-check.log");

    assert.strictEqual(reportData.lintIssues.length, 1);
    const [issue] = reportData.lintIssues;

    assert.strictEqual(issue.file, "src/components/Widget.astro");
    assert.strictEqual(issue.line, 5);
    assert.strictEqual(issue.column, 9);
    assert.strictEqual(issue.severity, "error");
    assert.strictEqual(issue.rule, "TS1234");
    assert.strictEqual(issue.message, "Some issue without hyphen.");
  });

  it("parses Astro reports with zero diagnostics", () => {
    const parser = new AstroCheckParser();

    const reportData = parser.parse(SAMPLE_EMPTY_REPORT, "astro-check.log");

    assert.strictEqual(reportData.lintIssues.length, 0);
  });
});
