/**
 * Represents a test result
 */
export class TestResult {
  constructor({
    name,
    status,
    duration = 0,
    message = "",
    errorType = "",
    stackTrace = "",
    file = "",
    suite = "",
  }) {
    this.name = name;
    this.status = status; // 'passed', 'failed', 'skipped', 'error'
    this.duration = duration;
    this.message = message;
    this.errorType = errorType;
    this.stackTrace = stackTrace;
    this.file = file;
    this.suite = suite;
  }

  isPassed() {
    return this.status === "passed";
  }

  isFailed() {
    return this.status === "failed" || this.status === "error";
  }

  isSkipped() {
    return this.status === "skipped";
  }
}

/**
 * Represents a lint/check issue
 */
export class LintIssue {
  constructor({ file, line, column, severity, rule, message, source = "" }) {
    this.file = file;
    this.line = line;
    this.column = column;
    this.severity = severity; // 'error', 'warning', 'info'
    this.rule = rule;
    this.message = message;
    this.source = source;
  }

  isError() {
    return this.severity === "error";
  }

  isWarning() {
    return this.severity === "warning";
  }
}

/**
 * Represents coverage data
 */
export class Coverage {
  constructor({
    lines = { total: 0, covered: 0, percentage: 0 },
    branches = { total: 0, covered: 0, percentage: 0 },
    functions = { total: 0, covered: 0, percentage: 0 },
    statements = { total: 0, covered: 0, percentage: 0 },
  }) {
    this.lines = lines;
    this.branches = branches;
    this.functions = functions;
    this.statements = statements;
  }

  getOverallPercentage() {
    // Use line coverage as the primary metric
    return this.lines.percentage;
  }
}

/**
 * Aggregated report data
 */
export class ReportData {
  constructor() {
    this.tests = [];
    this.lintIssues = [];
    this.coverage = null;
    this.reportType = "unknown"; // 'test', 'lint', 'coverage', 'mixed'
  }

  addTest(test) {
    this.tests.push(test);
  }

  addLintIssue(issue) {
    this.lintIssues.push(issue);
  }

  setCoverage(coverage) {
    this.coverage = coverage;
  }

  getPassedTests() {
    return this.tests.filter((t) => t.isPassed());
  }

  getFailedTests() {
    return this.tests.filter((t) => t.isFailed());
  }

  getSkippedTests() {
    return this.tests.filter((t) => t.isSkipped());
  }

  getErrors() {
    return this.lintIssues.filter((i) => i.isError());
  }

  getWarnings() {
    return this.lintIssues.filter((i) => i.isWarning());
  }

  hasErrors() {
    return this.getFailedTests().length > 0 || this.getErrors().length > 0;
  }

  getTotalTests() {
    return this.tests.length;
  }

  getPassedCount() {
    return this.getPassedTests().length;
  }

  getFailedCount() {
    return this.getFailedTests().length;
  }

  getSkippedCount() {
    return this.getSkippedTests().length;
  }
}
