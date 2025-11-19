// Dynamically import ES modules
async function runAction({ core, glob: globModule, inputs }) {
  try {
    // Import the core parser
    const { ReportParserCore } = await import("./ReportParserCore.js");

    const parserCore = new ReportParserCore();

    core.info(`Report Name: ${inputs.reportName}`);
    core.info(`Output Format: ${inputs.outputFormat}`);

    // Find report files using glob
    const patternList = inputs.reportPaths
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

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

module.exports = { runAction };
