import { BaseParser, ReportCategory } from "./BaseParser.js";
import { ReportData, LintIssue } from "../models/ReportData.js";

const SUMMARY_PATTERNS = [
  "code style issues found",
  "all matched files use prettier",
  "files were not formatted",
  "checking formatting",
];

/**
 * Parser for Prettier --check CLI output captured in log files
 */
export class PrettierParser extends BaseParser {
  canParse(filePath, content) {
    if (!content) {
      return false;
    }

    const normalizedContent = content.toLowerCase();
    const hasPrettierMarkers = SUMMARY_PATTERNS.some((pattern) =>
      normalizedContent.includes(pattern),
    );

    if (hasPrettierMarkers) {
      return true;
    }

    if (filePath?.toLowerCase().includes("prettier")) {
      return /\[(warn|error)\]\s+.+/i.test(content);
    }

    return false;
  }

  getPriority() {
    return 7;
  }

  getCategory() {
    return ReportCategory.LINT;
  }

  getAutoPatterns() {
    return [
      "**/prettier-check.log",
      "**/prettier-check.txt",
      "**/prettier-report.log",
      "**/prettier-report.txt",
    ];
  }

  parse(content) {
    const reportData = new ReportData();
    reportData.reportType = "lint";

    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      const match = line.match(/^\[(warn|error)\]\s+(.+)$/i);
      if (!match) {
        continue;
      }

      const description = match[2].trim();
      if (this._isSummaryLine(description)) {
        continue;
      }

      const { file, message } = this._extractFileAndMessage(description);

      const issue = new LintIssue({
        file,
        line: 0,
        column: 0,
        severity: "error",
        rule: "prettier",
        message,
        source: "prettier",
      });

      reportData.addLintIssue(issue);
    }

    return reportData;
  }

  _isSummaryLine(text) {
    const normalized = text.toLowerCase();
    return SUMMARY_PATTERNS.some((pattern) => normalized.includes(pattern));
  }

  _extractFileAndMessage(description) {
    const separatorIndex = description.indexOf(": ");

    if (separatorIndex === -1) {
      return {
        file: description,
        message: "File is not formatted according to Prettier",
      };
    }

    return {
      file: description.slice(0, separatorIndex).trim(),
      message: description.slice(separatorIndex + 2).trim(),
    };
  }
}
