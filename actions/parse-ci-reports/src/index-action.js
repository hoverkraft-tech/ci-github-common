// Dynamically import ES modules
async function runAction({ core, glob: globModule, inputs }) {
  try {
    // Import the core parser and path resolver
    const { ReportParserCore } = await import("./ReportParserCore.js");
    const { ReportPathResolver } = await import("./ReportPathResolver.js");

    const parserCore = new ReportParserCore();
    const pathResolver = new ReportPathResolver();

    core.info(`Report Name: ${inputs.reportName}`);
    core.info(`Output Format: ${inputs.outputFormat}`);

    // Parse output formats (comma-separated or "all")
    const outputFormats = parseOutputFormats(inputs.outputFormat);
    core.info(`Output formats: ${outputFormats.join(", ")}`);

    // Resolve report paths using the dedicated component
    const patternList = pathResolver.resolvePatterns(
      inputs.reportPaths,
      (msg) => core.info(msg),
    );

    // Find report files
    const uniqueFiles = await pathResolver.findFiles(patternList, globModule);
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
    if (outputFormats.includes("annotations")) {
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
    if (outputFormats.includes("summary")) {
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
 * Parse output format string into array of formats
 * @param {string} outputFormat - Output format string (comma-separated or "all")
 * @returns {string[]} Array of output format values
 */
function parseOutputFormats(outputFormat) {
  if (outputFormat === "all") {
    return ["summary", "markdown", "annotations"];
  }

  return outputFormat
    .split(",")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
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
