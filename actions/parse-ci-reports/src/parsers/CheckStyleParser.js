import { XMLParser } from "fast-xml-parser";
import { BaseParser, ReportCategory } from "./BaseParser.js";
import { ReportData, LintIssue } from "../models/ReportData.js";

/**
 * Parser for CheckStyle XML format
 * Used by many linters including CheckStyle (Java), PHP_CodeSniffer, etc.
 */
export class CheckStyleParser extends BaseParser {
  constructor() {
    super();
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
  }

  canParse(filePath, content) {
    return (
      (filePath.toLowerCase().includes("checkstyle") ||
        filePath.endsWith(".xml")) &&
      content.includes("<checkstyle") &&
      content.includes("<file")
    );
  }

  getPriority() {
    return 8;
  }

  getCategory() {
    return ReportCategory.LINT;
  }

  getAutoPatterns() {
    return ["**/checkstyle-result.xml", "**/checkstyle.xml"];
  }

  parse(content) {
    const reportData = new ReportData();
    reportData.reportType = "lint";

    try {
      const parsed = this.xmlParser.parse(content);
      const checkstyle = parsed.checkstyle;

      if (!checkstyle || !checkstyle.file) {
        return reportData;
      }

      const files = Array.isArray(checkstyle.file)
        ? checkstyle.file
        : [checkstyle.file];

      for (const file of files) {
        this._parseFile(file, reportData);
      }
    } catch (error) {
      throw new Error(`Failed to parse CheckStyle XML: ${error.message}`);
    }

    return reportData;
  }

  _parseFile(file, reportData) {
    const fileName = file["@_name"] || "unknown";

    if (!file.error) {
      return;
    }

    const errors = Array.isArray(file.error) ? file.error : [file.error];

    for (const error of errors) {
      const issue = new LintIssue({
        file: fileName,
        line: parseInt(error["@_line"] || 0, 10),
        column: parseInt(error["@_column"] || 0, 10),
        severity: this._mapSeverity(error["@_severity"]),
        rule: error["@_source"] || "unknown",
        message: error["@_message"] || "",
      });

      reportData.addLintIssue(issue);
    }
  }

  _mapSeverity(severity) {
    if (!severity) return "info";

    const severityStr = String(severity).toLowerCase();
    if (severityStr === "error") return "error";
    if (severityStr === "warning" || severityStr === "warn") return "warning";
    if (severityStr === "info" || severityStr === "information") return "info";
    return "info";
  }
}
