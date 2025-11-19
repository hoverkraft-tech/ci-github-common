import { readFileSync } from "fs";
import { ParserFactory } from "./parsers/ParserFactory.js";
import { SummaryFormatter } from "./formatters/SummaryFormatter.js";
import { MarkdownFormatter } from "./formatters/MarkdownFormatter.js";
import { ReportData } from "./models/ReportData.js";

/**
 * Core report parsing logic shared between CLI and Action
 */
export class ReportParserCore {
  constructor() {
    this.parserFactory = new ParserFactory();
    this.summaryFormatter = new SummaryFormatter();
    this.markdownFormatter = new MarkdownFormatter();
  }

  /**
   * Parse all report files
   * @param {string[]} files - Array of file paths
   * @param {Function} logger - Logging function (info)
   * @param {Function} errorLogger - Error logging function
   * @returns {ReportData} Aggregated report data
   */
  parseReports(files, logger = console.log, errorLogger = console.error) {
    const aggregatedData = new ReportData();

    for (const file of files) {
      try {
        logger(`Parsing ${file}...`);
        const content = readFileSync(file, "utf-8");
        const reportData = this.parserFactory.parse(file, content);

        // Merge data
        aggregatedData.tests.push(...reportData.tests);
        aggregatedData.lintIssues.push(...reportData.lintIssues);

        if (reportData.coverage) {
          aggregatedData.setCoverage(reportData.coverage);
        }
      } catch (error) {
        errorLogger(`Error parsing ${file}: ${error.message}`);
        // Continue with other files
      }
    }

    return aggregatedData;
  }

  /**
   * Generate formatted output
   * @param {ReportData} reportData - The parsed report data
   * @param {string} reportName - Name of the report
   * @param {boolean} includePassed - Include passed tests
   * @param {string} outputFormat - Output format (summary, markdown, both)
   * @returns {Object} Object with markdown and summary strings
   */
  generateOutput(reportData, reportName, includePassed, outputFormat) {
    let markdown = "";
    let summary = "";

    if (outputFormat === "markdown" || outputFormat === "both") {
      markdown = this.markdownFormatter.format(reportData, reportName);
    }

    if (outputFormat === "summary" || outputFormat === "both") {
      summary = this.summaryFormatter.format(
        reportData,
        reportName,
        includePassed,
      );
    }

    return { markdown, summary };
  }
}
