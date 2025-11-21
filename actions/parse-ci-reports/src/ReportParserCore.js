import { ParserFactory } from "./parsers/ParserFactory.js";
import { SummaryFormatter } from "./formatters/SummaryFormatter.js";
import { MarkdownFormatter } from "./formatters/MarkdownFormatter.js";
import { ReportData } from "./models/ReportData.js";
import { PathRewriter } from "./PathRewriter.js";

/**
 * Core report parsing logic shared between CLI and Action
 */
export class ReportParserCore {
  constructor(fileSystemService, logger, pathMapping = null) {
    this.fileSystemService = fileSystemService;
    this.logger = logger;
    this.parserFactory = new ParserFactory(fileSystemService);
    this.summaryFormatter = new SummaryFormatter();
    this.markdownFormatter = new MarkdownFormatter();
    this.pathRewriter = new PathRewriter(pathMapping);
  }

  /**
   * Parse all report files
   * @param {string[]} files - Array of file paths
   * @returns {ReportData} Aggregated report data
   */
  parseReports(files) {
    const aggregatedData = new ReportData();

    // Log path rewriting configuration if enabled
    if (this.pathRewriter.isEnabled()) {
      const mappings = this.pathRewriter.getMappings();
      this.logger.info(
        `Path rewriting enabled with ${mappings.length} mapping(s):`,
      );
      for (const mapping of mappings) {
        this.logger.info(`  "${mapping.from}" → "${mapping.to}"`);
      }
    }

    for (const file of files) {
      this.logger.info(`Parsing ${file}...`);
      const reportData = this.parserFactory.parse(file);

      // Apply path rewriting to test results
      for (const test of reportData.tests) {
        test.file = this.pathRewriter.rewritePath(test.file);
      }

      // Apply path rewriting to lint issues
      for (const issue of reportData.lintIssues) {
        issue.file = this.pathRewriter.rewritePath(issue.file);
      }

      // Merge data
      aggregatedData.tests.push(...reportData.tests);
      aggregatedData.lintIssues.push(...reportData.lintIssues);

      if (reportData.coverage) {
        aggregatedData.setCoverage(reportData.coverage);
      }
    }

    return aggregatedData;
  }

  /**
   * Generate formatted output
   * @param {ReportData} reportData - The parsed report data
   * @param {string} reportName - Name of the report
   * @param {boolean} includePassed - Include passed tests
   * @param {string} outputFormat - Output format (comma-separated: summary, markdown, annotations, or "all")
   * @returns {Object} Object with markdown and summary strings
   */
  generateOutput(reportData, reportName, includePassed, outputFormat) {
    // Parse output formats
    const formats = this.parseOutputFormats(outputFormat);

    let markdown = "";
    let summary = "";

    if (formats.includes("markdown")) {
      markdown = this.markdownFormatter.format(reportData, reportName);
    }

    if (formats.includes("summary")) {
      summary = this.summaryFormatter.format(
        reportData,
        reportName,
        includePassed,
      );
    }

    return { markdown, summary };
  }

  /**
   * Parse output format string into array of formats
   * @param {string} outputFormat - Output format string (comma-separated or "all")
   * @returns {string[]} Array of output format values
   */
  parseOutputFormats(outputFormat) {
    if (outputFormat === "all") {
      return ["summary", "markdown", "annotations"];
    }

    return outputFormat
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  }
}
