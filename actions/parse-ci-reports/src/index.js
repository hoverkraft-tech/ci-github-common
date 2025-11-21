// Dynamically import ES modules
export async function run({ core, glob: globModule, inputs }) {
  try {
    // Import the core parser and path resolver
    const { FileSystemService } = await import("./FileSystemService.js");
    const { ReportParserCore } = await import("./ReportParserCore.js");
    const { ReportPathResolver } = await import("./ReportPathResolver.js");
    const { LoggerService } = await import("./LoggerService.js");

    const fileSystemService = new FileSystemService(inputs.workingDirectory);
    const logger = new LoggerService(core);

    const parserCore = new ReportParserCore(
      fileSystemService,
      logger,
      inputs.pathMapping,
    );
    const pathResolver = new ReportPathResolver(fileSystemService, logger);

    logger.info(`Report Name: ${inputs.reportName}`);
    logger.info(`Output Format: ${inputs.outputFormat}`);
    if (inputs.pathMapping) {
      logger.info(`Path Mapping: ${inputs.pathMapping}`);
    }

    // Parse output formats (comma-separated or "all")
    const outputFormats = parserCore.parseOutputFormats(inputs.outputFormat);
    logger.info(`Output formats: ${outputFormats.join(", ")}`);

    // Resolve report paths using the dedicated component
    const patternList = pathResolver.resolvePatterns(inputs.reportPaths);

    // Find report files
    const uniqueFiles = await pathResolver.findFiles(patternList, globModule);
    logger.info(`Found ${uniqueFiles.length} report file(s)`);

    if (uniqueFiles.length === 0) {
      logger.warning("No report files found");
      return;
    }

    // Parse reports using core
    const aggregatedData = parserCore.parseReports(uniqueFiles);

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
    core.setOutput("parsed-files", JSON.stringify(uniqueFiles));

    // Log summary
    logger.info("\n--- Summary ---");
    logger.info(`Total tests: ${aggregatedData.getTotalTests()}`);
    logger.info(`Passed: ${aggregatedData.getPassedCount()}`);
    logger.info(`Failed: ${aggregatedData.getFailedCount()}`);
    logger.info(`Skipped: ${aggregatedData.getSkippedCount()}`);
    logger.info(`Lint issues: ${aggregatedData.lintIssues.length}`);
    if (aggregatedData.coverage) {
      logger.info(
        `Coverage: ${aggregatedData.coverage
          .getOverallPercentage()
          .toFixed(2)}%`,
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
