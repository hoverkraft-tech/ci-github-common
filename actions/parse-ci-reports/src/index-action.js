// Auto-detection patterns for common report files
const AUTO_PATTERNS = {
  test: [
    "**/junit*.xml",
    "**/test-results/**/*.xml",
    "**/test-reports/**/*.xml",
    "**/*test*.xml",
    "**/*.tap",
  ],
  coverage: [
    "**/coverage/lcov.info",
    "**/coverage/cobertura-coverage.xml",
    "**/coverage.xml",
    "**/lcov.info",
    "**/cobertura.xml",
  ],
  lint: [
    "**/eslint-report.json",
    "**/eslint.json",
    "**/checkstyle-result.xml",
    "**/checkstyle.xml",
  ],
};

// Dynamically import ES modules
async function runAction({ core, glob: globModule, inputs }) {
  try {
    // Import the core parser
    const { ReportParserCore } = await import("./ReportParserCore.js");

    const parserCore = new ReportParserCore();

    core.info(`Report Name: ${inputs.reportName}`);
    core.info(`Output Format: ${inputs.outputFormat}`);

    // Handle auto-detection
    let patternList = inputs.reportPaths
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Check for auto mode
    const autoMode = patternList.find((p) => p.startsWith("auto:"));
    if (autoMode) {
      const mode = autoMode.split(":")[1];
      core.info(`Auto-detection mode: ${mode}`);

      patternList = [];
      if (mode === "all" || mode === "test") {
        patternList.push(...AUTO_PATTERNS.test);
      }
      if (mode === "all" || mode === "coverage") {
        patternList.push(...AUTO_PATTERNS.coverage);
      }
      if (mode === "all" || mode === "lint") {
        patternList.push(...AUTO_PATTERNS.lint);
      }

      core.info(`Using patterns: ${patternList.join(", ")}`);
    }

    // Find report files using glob
    const files = [];
    for (const pattern of patternList) {
      const globber = await globModule.create(pattern, {
        followSymbolicLinks: false,
      });
      const matches = await globber.glob();
      files.push(...matches);
    }

    // Remove duplicates
    const uniqueFiles = [...new Set(files)];
    core.info(`Found ${uniqueFiles.length} report file(s)`);

    if (uniqueFiles.length === 0) {
      core.warning("No report files found");
      return;
    }

    // Parse reports using core
    const aggregatedData = parserCore.parseReports(
      uniqueFiles,
      (msg) => core.info(msg),
      (msg) => core.error(msg),
    );

    // Generate GitHub annotations if requested
    if (
      inputs.outputFormat === "annotations" ||
      inputs.outputFormat === "both"
    ) {
      generateAnnotations(core, aggregatedData);
    }

    // Generate outputs using core
    const { markdown, summary } = parserCore.generateOutput(
      aggregatedData,
      inputs.reportName,
      inputs.includePassed,
      inputs.outputFormat,
    );

    // Write to GitHub Step Summary if needed
    if (inputs.outputFormat === "summary" || inputs.outputFormat === "both") {
      await core.summary.addRaw(summary).write();
    }

    // Set outputs
    core.setOutput("markdown", markdown);
    core.setOutput("summary", summary);
    core.setOutput("total-tests", aggregatedData.getTotalTests());
    core.setOutput("passed-tests", aggregatedData.getPassedCount());
    core.setOutput("failed-tests", aggregatedData.getFailedCount());
    core.setOutput("skipped-tests", aggregatedData.getSkippedCount());
    core.setOutput(
      "coverage-percentage",
      aggregatedData.coverage
        ? aggregatedData.coverage.getOverallPercentage().toFixed(2)
        : "0",
    );
    core.setOutput("has-errors", aggregatedData.hasErrors() ? "true" : "false");

    // Log summary
    core.info("\n--- Summary ---");
    core.info(`Total tests: ${aggregatedData.getTotalTests()}`);
    core.info(`Passed: ${aggregatedData.getPassedCount()}`);
    core.info(`Failed: ${aggregatedData.getFailedCount()}`);
    core.info(`Skipped: ${aggregatedData.getSkippedCount()}`);
    core.info(`Lint issues: ${aggregatedData.lintIssues.length}`);
    if (aggregatedData.coverage) {
      core.info(
        `Coverage: ${aggregatedData.coverage.getOverallPercentage().toFixed(2)}%`,
      );
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
    throw error;
  }
}

/**
 * Generate GitHub annotations for failed tests and lint issues
 */
function generateAnnotations(core, reportData) {
  // Annotate failed tests
  const failedTests = reportData.getFailedTests();
  for (const test of failedTests.slice(0, 10)) {
    // Limit to 10 annotations
    const properties = {
      title: `Test Failed: ${test.name}`,
    };

    if (test.file) {
      properties.file = test.file;
    }

    core.error(test.message || "Test failed", properties);
  }

  // Annotate lint errors and warnings
  annotateLintIssues(core, reportData.getErrors(), core.error, 10);
  annotateLintIssues(core, reportData.getWarnings(), core.warning, 10);
}

/**
 * Helper to annotate lint issues
 */
function annotateLintIssues(core, issues, annotationFn, limit) {
  for (const issue of issues.slice(0, limit)) {
    const properties = {
      title: `${issue.rule}: ${issue.message}`,
      file: issue.file,
      startLine: issue.line,
      startColumn: issue.column,
    };

    annotationFn.call(core, issue.message, properties);
  }
}

module.exports = { runAction };
