import { BaseFormatter } from "./BaseFormatter.js";

/**
 * Formatter for GitHub Step Summary
 * Generates markdown suitable for $GITHUB_STEP_SUMMARY
 */
export class SummaryFormatter extends BaseFormatter {
  /**
   * Format report data as GitHub Step Summary
   * @param {ReportData} reportData - The report data
   * @param {string} reportName - Name of the report
   * @param {boolean} includePassed - Whether to include passed tests
   * @returns {string} Formatted markdown
   */
  format(reportData, reportName, includePassed = false) {
    const sections = [`## ${reportName}\n`];
    sections.push(...this.buildSections(reportData, { includePassed }));
    return sections.join("\n");
  }

  _formatTestResults(reportData, options = {}) {
    const { includePassed = false } = options;
    const total = reportData.getTotalTests();
    const passed = reportData.getPassedCount();
    const failed = reportData.getFailedCount();
    const skipped = reportData.getSkippedCount();

    let output = "### Test Results\n\n";

    // Summary table
    output += "| Status | Count |\n";
    output += "|--------|-------|\n";
    output += `| ✅ Passed | ${passed} |\n`;
    output += `| ❌ Failed | ${failed} |\n`;
    output += `| ⏭️ Skipped | ${skipped} |\n`;
    output += `| **Total** | **${total}** |\n\n`;

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
    const errors = reportData.getErrors();
    const warnings = reportData.getWarnings();

    let output = "### Lint Issues\n\n";

    // Summary table
    output += "| Severity | Count |\n";
    output += "|----------|-------|\n";
    output += `| ❌ Errors | ${errors.length} |\n`;
    output += `| ⚠️ Warnings | ${warnings.length} |\n`;
    output += `| **Total** | **${reportData.lintIssues.length}** |\n\n`;

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
      output += `_... and ${issues.length - limit} more ${title.toLowerCase()}_\n\n`;
    }

    return output;
  }

  _formatCoverage(coverage) {
    let output = "### Coverage Report\n\n";

    output += "| Metric | Covered | Total | Percentage |\n";
    output += "|--------|---------|-------|------------|\n";

    if (coverage.lines.total > 0) {
      output += `| Lines | ${coverage.lines.covered} | ${coverage.lines.total} | ${this._formatPercentage(coverage.lines.percentage)} |\n`;
    }

    if (coverage.branches.total > 0) {
      output += `| Branches | ${coverage.branches.covered} | ${coverage.branches.total} | ${this._formatPercentage(coverage.branches.percentage)} |\n`;
    }

    if (coverage.functions.total > 0) {
      output += `| Functions | ${coverage.functions.covered} | ${coverage.functions.total} | ${this._formatPercentage(coverage.functions.percentage)} |\n`;
    }

    if (coverage.statements.total > 0) {
      output += `| Statements | ${coverage.statements.covered} | ${coverage.statements.total} | ${this._formatPercentage(coverage.statements.percentage)} |\n`;
    }

    output += "\n";

    // Overall percentage with visual indicator
    const overall = coverage.getOverallPercentage();
    output += `**Overall Coverage: ${this._formatPercentage(overall)}**\n`;
    output += this._getCoverageBar(overall) + "\n";

    return output;
  }

  _formatPercentage(percentage) {
    return `${percentage.toFixed(2)}%`;
  }

  _getCoverageBar(percentage) {
    const filled = Math.round(percentage / 5); // 20 blocks total
    const empty = 20 - filled;

    let bar = "";
    if (percentage >= 80) {
      bar = "🟩".repeat(filled) + "⬜".repeat(empty);
    } else if (percentage >= 60) {
      bar = "🟨".repeat(filled) + "⬜".repeat(empty);
    } else {
      bar = "🟥".repeat(filled) + "⬜".repeat(empty);
    }

    return bar;
  }
}
