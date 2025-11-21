import { MarkdownFormatter } from "./MarkdownFormatter.js";

/**
 * Formatter for GitHub Step Summary
 * Generates markdown suitable for $GITHUB_STEP_SUMMARY
 */
export class SummaryFormatter extends MarkdownFormatter {
  /**
   * Format report data as GitHub Step Summary
   * @param {ReportData} reportData - The report data
   * @param {string} reportName - Name of the report
   * @param {boolean} includePassed - Whether to include passed tests
   * @returns {string} Formatted markdown
   */
  format(reportData, reportName, includePassed = false) {
    this._includePassed = includePassed;
    try {
      return super.format(reportData, reportName);
    } finally {
      this._includePassed = undefined;
    }
  }

  _getTestFormatterArgs() {
    return [this._includePassed ?? false];
  }

  _formatTestResults(reportData, includePassed = false) {
    const failed = reportData.getFailedCount();
    const passed = reportData.getPassedCount();

    let output = "### Test Results\n\n";

    // Summary table
    output += this._buildTestSummaryTable(reportData);
    output += "\n";

    // Failed tests details
    if (failed > 0) {
      output += "#### Failed Tests\n\n";
      const failedTests = reportData.getFailedTests();

      for (const test of failedTests) {
        output += `- **${test.name}**\n`;
        if (test.suite) {
          output += `  - Suite: ${test.suite}\n`;
        }
        if (test.message) {
          output += `  - Error: ${this._escapeMarkdown(test.message)}\n`;
        }
        if (test.file) {
          output += `  - File: \`${test.file}\`\n`;
        }
        output += "\n";
      }
    }

    // Passed tests (if requested)
    if (includePassed && passed > 0) {
      output += "#### Passed Tests\n\n";
      const passedTests = reportData.getPassedTests();

      for (const test of passedTests) {
        output += `- ✅ ${test.name}`;
        if (test.suite) {
          output += ` (${test.suite})`;
        }
        output += "\n";
      }
      output += "\n";
    }

    return output;
  }

  _formatLintIssues(reportData) {
    let output = "### Lint Issues\n\n";

    // Summary table
    output += this._buildLintSummaryTable(reportData);
    output += "\n";

    const errors = reportData.getErrors();
    const warnings = reportData.getWarnings();

    // Error details
    if (errors.length > 0) {
      output += this._formatIssueList("Errors", errors, 10);
    }

    // Warning details (limited)
    if (warnings.length > 0) {
      output += this._formatIssueList("Warnings", warnings, 5);
    }

    return output;
  }

  _formatIssueList(title, issues, limit) {
    let output = `#### ${title}\n\n`;

    for (const issue of issues.slice(0, limit)) {
      output += `- **\`${issue.file}:${issue.line}:${issue.column}\`**\n`;
      output += `  - Rule: \`${issue.rule}\`\n`;
      output += `  - ${this._escapeMarkdown(issue.message)}\n\n`;
    }

    if (issues.length > limit) {
      output += `_... and ${
        issues.length - limit
      } more ${title.toLowerCase()}_\n\n`;
    }

    return output;
  }

  _formatCoverage(coverage) {
    let output = "### Coverage Report\n\n";

    output += "| Metric | Covered | Total | Percentage |\n";
    output += "|--------|---------|-------|------------|\n";
    output += this._buildCoverageRows(coverage);
    output += "\n";

    // Overall percentage with visual indicator
    const overall = coverage.getOverallPercentage();
    output += `**Overall Coverage: ${this._formatPercentage(overall)}**\n`;
    output += this._getCoverageBar(overall) + "\n";

    return output;
  }
}
