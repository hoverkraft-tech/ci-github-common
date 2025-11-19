/**
 * Formatter for markdown output suitable for PR/issue comments
 * Generates more concise output than SummaryFormatter
 */
export class MarkdownFormatter {
  /**
   * Format report data as markdown for PR comments
   * @param {ReportData} reportData - The report data
   * @param {string} reportName - Name of the report
   * @returns {string} Formatted markdown
   */
  format(reportData, reportName) {
    const sections = [];

    sections.push(`### ${reportName}\n`);

    // Add test results section
    if (reportData.getTotalTests() > 0) {
      sections.push(this._formatTestResults(reportData));
    }

    // Add lint issues section
    if (reportData.lintIssues.length > 0) {
      sections.push(this._formatLintIssues(reportData));
    }

    // Add coverage section
    if (reportData.coverage) {
      sections.push(this._formatCoverage(reportData.coverage));
    }

    return sections.join('\n');
  }

  _formatTestResults(reportData) {
    const total = reportData.getTotalTests();
    const passed = reportData.getPassedCount();
    const failed = reportData.getFailedCount();
    const skipped = reportData.getSkippedCount();

    let output = '';

    // Compact summary
    const status = failed > 0 ? '❌' : '✅';
    output += `${status} **Tests:** ${passed} passed, ${failed} failed, ${skipped} skipped (${total} total)\n\n`;

    // Failed tests (limit to 5 for PR comments)
    if (failed > 0) {
      output += '<details>\n<summary>Failed Tests</summary>\n\n';
      
      const failedTests = reportData.getFailedTests().slice(0, 5);
      for (const test of failedTests) {
        output += `- **${test.name}**\n`;
        if (test.message) {
          const shortMessage = test.message.substring(0, 200);
          output += `  \`\`\`\n  ${shortMessage}${test.message.length > 200 ? '...' : ''}\n  \`\`\`\n`;
        }
      }

      if (reportData.getFailedTests().length > 5) {
        output += `\n_... and ${reportData.getFailedTests().length - 5} more failures_\n`;
      }

      output += '</details>\n\n';
    }

    return output;
  }

  _formatLintIssues(reportData) {
    const errors = reportData.getErrors();
    const warnings = reportData.getWarnings();

    let output = '';

    // Compact summary
    const status = errors.length > 0 ? '❌' : warnings.length > 0 ? '⚠️' : '✅';
    output += `${status} **Lint:** ${errors.length} errors, ${warnings.length} warnings\n\n`;

    // Error details (limit to 5 for PR comments)
    if (errors.length > 0) {
      output += '<details>\n<summary>Lint Errors</summary>\n\n';
      
      for (const issue of errors.slice(0, 5)) {
        output += `- \`${issue.file}:${issue.line}\` - ${issue.message}\n`;
      }

      if (errors.length > 5) {
        output += `\n_... and ${errors.length - 5} more errors_\n`;
      }

      output += '</details>\n\n';
    }

    return output;
  }

  _formatCoverage(coverage) {
    const percentage = coverage.getOverallPercentage();
    const emoji = this._getCoverageEmoji(percentage);
    
    let output = `${emoji} **Coverage:** ${percentage.toFixed(2)}%\n`;

    // Add breakdown if available
    const details = [];
    if (coverage.lines.total > 0) {
      details.push(`Lines: ${coverage.lines.percentage.toFixed(1)}%`);
    }
    if (coverage.branches.total > 0) {
      details.push(`Branches: ${coverage.branches.percentage.toFixed(1)}%`);
    }
    if (coverage.functions.total > 0) {
      details.push(`Functions: ${coverage.functions.percentage.toFixed(1)}%`);
    }

    if (details.length > 0) {
      output += `  - ${details.join(' | ')}\n`;
    }

    output += '\n';
    return output;
  }

  _getCoverageEmoji(percentage) {
    if (percentage >= 80) return '🟢';
    if (percentage >= 60) return '🟡';
    return '🔴';
  }
}
