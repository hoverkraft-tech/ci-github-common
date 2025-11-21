import { describe, it } from "node:test";
import assert from "node:assert/strict";
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
