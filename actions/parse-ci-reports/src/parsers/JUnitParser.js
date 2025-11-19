import { XMLParser } from "fast-xml-parser";
import { BaseParser } from "./BaseParser.js";
import { ReportData, TestResult } from "../models/ReportData.js";

/**
 * Parser for JUnit XML format
 * Supports standard JUnit XML as produced by many testing frameworks
 */
export class JUnitParser extends BaseParser {
  constructor() {
    super();
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
    });
  }

  canParse(filePath, content) {
    return (
      (filePath.toLowerCase().includes("junit") || filePath.endsWith(".xml")) &&
      (content.includes("<testsuite") || content.includes("<testsuites"))
    );
  }

  getPriority() {
    return 10;
  }

  parse(content) {
    const reportData = new ReportData();
    reportData.reportType = "test";

    try {
      const parsed = this.xmlParser.parse(content);

      // Handle both <testsuites> and single <testsuite> root elements
      const testsuites = this._normalizeTestSuites(parsed);

      for (const testsuite of testsuites) {
        this._parseTestSuite(testsuite, reportData);
      }
    } catch (error) {
      throw new Error(`Failed to parse JUnit XML: ${error.message}`);
    }

    return reportData;
  }

  _normalizeTestSuites(parsed) {
    // Handle different root elements
    if (parsed.testsuites) {
      const suites = parsed.testsuites.testsuite;
      return Array.isArray(suites) ? suites : [suites];
    } else if (parsed.testsuite) {
      return Array.isArray(parsed.testsuite)
        ? parsed.testsuite
        : [parsed.testsuite];
    }
    return [];
  }

  _parseTestSuite(testsuite, reportData) {
    if (!testsuite) return;

    const suiteName = testsuite["@_name"] || "Unknown Suite";
    const testcases = testsuite.testcase;

    if (!testcases) return;

    const cases = Array.isArray(testcases) ? testcases : [testcases];

    for (const testcase of cases) {
      const test = this._parseTestCase(testcase, suiteName);
      reportData.addTest(test);
    }
  }

  _parseTestCase(testcase, suiteName) {
    const name = testcase["@_name"] || "Unknown Test";
    const className = testcase["@_classname"] || testcase["@_class"] || "";
    const time = parseFloat(testcase["@_time"] || 0);
    const file = testcase["@_file"] || "";

    let status = "passed";
    let message = "";
    let errorType = "";
    let stackTrace = "";

    // Check for failure
    if (testcase.failure) {
      status = "failed";
      const failure = testcase.failure;
      message = failure["@_message"] || failure["#text"] || "Test failed";
      errorType = failure["@_type"] || "AssertionError";
      stackTrace = failure["#text"] || "";
    }
    // Check for error
    else if (testcase.error) {
      status = "error";
      const error = testcase.error;
      message = error["@_message"] || error["#text"] || "Test error";
      errorType = error["@_type"] || "Error";
      stackTrace = error["#text"] || "";
    }
    // Check for skipped
    else if (testcase.skipped) {
      status = "skipped";
      const skipped = testcase.skipped;
      message = skipped["@_message"] || skipped["#text"] || "Test skipped";
    }

    return new TestResult({
      name,
      status,
      duration: time,
      message,
      errorType,
      stackTrace,
      file: file || className,
      suite: suiteName,
    });
  }
}
