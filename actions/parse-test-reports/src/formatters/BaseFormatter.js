/**
 * Base formatter with common utilities
 */
export class BaseFormatter {
  /**
   * Build sections from report data
   * @param {ReportData} reportData - The report data
   * @param {Object} options - Formatting options
   * @returns {Array<string>} Array of formatted sections
   */
  buildSections(reportData, options = {}) {
    const sections = [];

    if (reportData.getTotalTests() > 0) {
      sections.push(this._formatTestResults(reportData, options));
    }

    if (reportData.lintIssues.length > 0) {
      sections.push(this._formatLintIssues(reportData));
    }

    if (reportData.coverage) {
      sections.push(this._formatCoverage(reportData.coverage));
    }

    return sections;
  }

  _escapeMarkdown(text) {
    return text.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
  }

  _formatPercentage(percentage) {
    return `${percentage.toFixed(2)}%`;
  }
}
