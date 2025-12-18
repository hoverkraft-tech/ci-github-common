import { BaseParser, ReportCategory } from "./BaseParser.js";
import { ReportData, LintIssue } from "../models/ReportData.js";

/**
 * Parser for ESLint JSON format
 * Standard format for ESLint output
 */
export class ESLintParser extends BaseParser {
  canParse(_filePath, content) {
    try {
      const data = JSON.parse(content);
      // ESLint format is an array of file results
      return (
        Array.isArray(data) &&
        data.length > 0 &&
        Object.hasOwn(data[0], "filePath") &&
        Object.hasOwn(data[0], "messages")
      );
    } catch {
      return false;
    }
  }

  getPriority() {
    return 10;
  }

  getCategory() {
    return ReportCategory.LINT;
  }

  getAutoPatterns() {
    return ["**/eslint-report.json", "**/eslint.json"];
  }

  parse(content) {
    const reportData = new ReportData();
    reportData.reportType = "lint";

    try {
      const data = JSON.parse(content);

      for (const fileResult of data) {
        const file = fileResult.filePath || fileResult.fileName || "unknown";

        if (!fileResult.messages || fileResult.messages.length === 0) {
          continue;
        }

        for (const message of fileResult.messages) {
          const issue = new LintIssue({
            file,
            line: message.line || 0,
            column: message.column || 0,
            severity: this._mapSeverity(message.severity),
            rule: message.ruleId || "unknown",
            message: message.message || "",
            source: message.source || "",
          });

          reportData.addLintIssue(issue);
        }
      }
    } catch (error) {
      throw new Error(`Failed to parse ESLint JSON: ${error.message}`);
    }

    return reportData;
  }

  _mapSeverity(severity) {
    // ESLint severity: 0 = off, 1 = warning, 2 = error
    if (typeof severity === "number") {
      if (severity === 2) return "error";
      if (severity === 1) return "warning";
      return "info";
    }

    // Handle string severity
    const severityStr = String(severity).toLowerCase();
    if (severityStr === "error" || severityStr === "2") return "error";
    if (
      severityStr === "warning" ||
      severityStr === "warn" ||
      severityStr === "1"
    )
      return "warning";
    return "info";
  }
}
