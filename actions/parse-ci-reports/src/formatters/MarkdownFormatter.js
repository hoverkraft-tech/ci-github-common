import { BaseFormatter } from "./BaseFormatter.js";

/**
 * Formatter for markdown output suitable for PR/issue comments
 * Generates a rich report similar to the summary formatter
 */
export class MarkdownFormatter extends BaseFormatter {
  /**
   * Compose the markdown structure with a report heading
   */
  composeReport(reportName, sections) {
    return [`## ${reportName}\n`, ...sections].join("\n");
  }

  _formatTestResults(reportData) {
    const total = reportData.getTotalTests();
    const passed = reportData.getPassedCount();
    const failed = reportData.getFailedCount();
    const passRate = total === 0 ? 0 : (passed / total) * 100;
    const statusEmoji =
      failed > 0 ? "❌" : reportData.getSkippedCount() === total ? "⏭️" : "✅";

    let output = "### Test Results\n\n";
    output += this._buildTestSummaryTable(reportData);
    output += "\n";

    output += `> ${statusEmoji} **Pass Rate:** ${passRate.toFixed(1)}%\n\n`;

    if (failed > 0) {
      output += "<details>\n<summary>Failed Tests</summary>\n\n";

      const failedTests = reportData.getFailedTests();
      for (const test of failedTests.slice(0, 5)) {
        output += `- **${this._escapeMarkdown(test.name)}**`;
        if (test.suite) {
          output += ` _(suite: ${this._escapeMarkdown(test.suite)})_`;
        }
        output += "\n";

        if (test.file) {
          output += `  - File: \`${test.file}\`\n`;
        }

        if (test.message) {
          output += `  - Error: ${this._escapeMarkdown(
            this._truncate(test.message, 200),
          )}\n`;
        }
      }

      if (failedTests.length > 5) {
        output += `\n_... and ${failedTests.length - 5} more failures_\n`;
      }

      output += "\n</details>\n\n";
    }

    return output;
  }

  _formatLintIssues(reportData) {
    let output = "### Lint Checks\n\n";
    output += this._buildLintSummaryTable(reportData);
    output += "\n";

    const errors = reportData.getErrors();
    const warnings = reportData.getWarnings();

    if (errors.length > 0) {
      output += this._renderIssueDetails("Errors", errors, 5);
    }

    if (warnings.length > 0) {
      output += this._renderIssueDetails("Warnings", warnings, 5);
    }

    return output;
  }

  _formatCoverage(coverage) {
    let output = "### Coverage\n\n";

    output += "| Metric | Covered | Total | Percentage |\n";
    output += "|--------|---------|-------|------------|\n";
    output += this._buildCoverageRows(coverage);

    const overall = coverage.getOverallPercentage();
    output += "\n";
    output += `**Overall:** ${this._formatPercentage(
      overall,
    )} ${this._getCoverageEmoji(overall)}\n`;
    output += `${this._getCoverageBar(overall)}\n\n`;

    return output;
  }

  _getCoverageEmoji(percentage) {
    if (percentage >= 80) return "🟢";
    if (percentage >= 60) return "🟡";
    return "🔴";
  }

  _renderIssueDetails(title, issues, limit) {
    let output = `<details>\n<summary>${title}</summary>\n\n`;

    for (const issue of issues.slice(0, limit)) {
      const location = `\`${issue.file}:${issue.line}:${issue.column}\``;
      output += `- ${location} - ${this._escapeMarkdown(issue.message)}\n`;
      output += `  - Rule: \`${issue.rule}\`\n`;
    }

    if (issues.length > limit) {
      output += `\n_... and ${
        issues.length - limit
      } more ${title.toLowerCase()}_\n`;
    }

    output += "\n</details>\n\n";
    return output;
  }

  _escapeMarkdown(text) {
    return text.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
  }

  _buildTestSummaryTable(reportData) {
    const total = reportData.getTotalTests();
    const passed = reportData.getPassedCount();
    const failed = reportData.getFailedCount();
    const skipped = reportData.getSkippedCount();

    const lines = [
      "| Status | Count |",
      "|--------|-------|",
      `| ✅ Passed | ${passed} |`,
      `| ❌ Failed | ${failed} |`,
      `| ⏭️ Skipped | ${skipped} |`,
      `| **Total** | **${total}** |`,
      "",
    ];

    return lines.join("\n");
  }

  _buildLintSummaryTable(reportData) {
    const errors = reportData.getErrors();
    const warnings = reportData.getWarnings();

    const lines = [
      "| Severity | Count |",
      "|----------|-------|",
      `| ❌ Errors | ${errors.length} |`,
      `| ⚠️ Warnings | ${warnings.length} |`,
      `| **Total** | **${reportData.lintIssues.length}** |`,
      "",
    ];

    return lines.join("\n");
  }

  _getCoverageBar(percentage) {
    const totalBlocks = 20;
    const filled = Math.min(
      Math.round((percentage / 100) * totalBlocks),
      totalBlocks,
    );
    const empty = Math.max(totalBlocks - filled, 0);

    if (percentage >= 80) {
      return "🟩".repeat(filled) + "⬜".repeat(empty);
    }
    if (percentage >= 60) {
      return "🟨".repeat(filled) + "⬜".repeat(empty);
    }
    return "🟥".repeat(filled) + "⬜".repeat(empty);
  }
}
