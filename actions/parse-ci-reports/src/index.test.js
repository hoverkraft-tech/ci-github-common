import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ReportParserCore } from "./ReportParserCore.js";

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
