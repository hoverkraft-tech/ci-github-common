#!/usr/bin/env node

import { writeFileSync } from "fs";
import { glob } from "glob";
import { ReportParserCore } from "./ReportParserCore.js";

/**
 * Main entry point for the CLI
 */
class ReportParser {
  constructor() {
    this.core = new ReportParserCore();
  }

  /**
   * Parse command line arguments
   */
  parseArgs() {
    const args = process.argv.slice(2);
    return {
      reportPaths: args[0] || "",
      reportName: args[1] || "Report Summary",
      includePassed: args[2] === "true",
      outputFormat: args[3] || "both",
    };
  }

  /**
   * Find report files based on glob patterns
   */
  async findReportFiles(patterns) {
    const patternList = patterns
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const files = [];
    for (const pattern of patternList) {
      const matches = await glob(pattern, { nodir: true });
      files.push(...matches);
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Set GitHub Actions outputs
   */
  setOutputs(reportData, markdown, summary) {
    const outputs = {
      markdown: markdown.replace(/\n/g, "%0A"),
      summary: summary.replace(/\n/g, "%0A"),
      "total-tests": reportData.getTotalTests(),
      "passed-tests": reportData.getPassedCount(),
      "failed-tests": reportData.getFailedCount(),
      "skipped-tests": reportData.getSkippedCount(),
      "coverage-percentage": reportData.coverage
        ? reportData.coverage.getOverallPercentage().toFixed(2)
        : "0",
      "has-errors": reportData.hasErrors() ? "true" : "false",
    };

    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      let outputContent = "";
      for (const [key, value] of Object.entries(outputs)) {
        outputContent += `${key}=${value}\n`;
      }
      writeFileSync(outputFile, outputContent, { flag: "a" });
    } else {
      // Fallback for local testing
      console.log("Outputs:", outputs);
    }
  }

  /**
   * Main execution
   */
  async run() {
    try {
      const args = this.parseArgs();

      console.log(`Report Name: ${args.reportName}`);
      console.log(`Output Format: ${args.outputFormat}`);

      // Find report files
      const files = await this.findReportFiles(args.reportPaths);
      console.log(`Found ${files.length} report file(s)`);

      if (files.length === 0) {
        console.warn("No report files found");
        return;
      }

      // Parse reports using core
      const reportData = this.core.parseReports(files);

      // Generate outputs using core
      const { markdown, summary } = this.core.generateOutput(
        reportData,
        args.reportName,
        args.includePassed,
        args.outputFormat,
      );

      // Write summary to temp file for backward compatibility
      if (args.outputFormat === "summary" || args.outputFormat === "both") {
        writeFileSync("/tmp/test-report-summary.md", summary);
      }

      // Set outputs
      this.setOutputs(reportData, markdown, summary);

      console.log("\n--- Summary ---");
      console.log(`Total tests: ${reportData.getTotalTests()}`);
      console.log(`Passed: ${reportData.getPassedCount()}`);
      console.log(`Failed: ${reportData.getFailedCount()}`);
      console.log(`Skipped: ${reportData.getSkippedCount()}`);
      console.log(`Lint issues: ${reportData.lintIssues.length}`);
      if (reportData.coverage) {
        console.log(
          `Coverage: ${reportData.coverage.getOverallPercentage().toFixed(2)}%`,
        );
      }
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  }
}

// Run the parser
const parser = new ReportParser();
parser.run();
