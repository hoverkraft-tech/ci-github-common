/**
 * Base formatter with common (non-markdown) utilities
 */
export class BaseFormatter {
  format(reportData, reportName) {
    const sections = this.buildSections(reportData);
    return this.composeReport(reportName, sections);
  }

  buildSections(reportData) {
    const sections = [];

    if (this._shouldIncludeTests(reportData)) {
      sections.push(
        this._formatTestResults(reportData, ...this._getTestFormatterArgs()),
      );
    }

    if (this._shouldIncludeLint(reportData)) {
      sections.push(this._formatLintIssues(reportData));
    }

    if (this._shouldIncludeCoverage(reportData)) {
      sections.push(this._formatCoverage(reportData.coverage));
    }

    return sections;
  }

  composeReport(_reportName, sections) {
    return sections.join("\n");
  }

  _shouldIncludeTests(reportData) {
    return reportData.getTotalTests() > 0;
  }

  _shouldIncludeLint(reportData) {
    return reportData.lintIssues.length > 0;
  }

  _shouldIncludeCoverage(reportData) {
    return Boolean(reportData.coverage);
  }

  _getTestFormatterArgs() {
    return [];
  }

  _truncate(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength)}...`;
  }

  _formatPercentage(percentage) {
    return `${percentage.toFixed(2)}%`;
  }

  _buildCoverageRows(coverage) {
    const rows = [];

    if (coverage.lines.total > 0) {
      rows.push(this._formatCoverageRow("Lines", coverage.lines));
    }

    if (coverage.branches.total > 0) {
      rows.push(this._formatCoverageRow("Branches", coverage.branches));
    }

    if (coverage.functions.total > 0) {
      rows.push(this._formatCoverageRow("Functions", coverage.functions));
    }

    if (coverage.statements && coverage.statements.total > 0) {
      rows.push(this._formatCoverageRow("Statements", coverage.statements));
    }

    return rows.length > 0 ? `${rows.join("\n")}\n` : "";
  }

  _formatCoverageRow(label, metric) {
    return `| ${label} | ${metric.covered} | ${
      metric.total
    } | ${this._formatPercentage(metric.percentage)} |`;
  }
}
