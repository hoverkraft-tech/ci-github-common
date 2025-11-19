#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { ParserFactory } from './parsers/ParserFactory.js';
import { SummaryFormatter } from './formatters/SummaryFormatter.js';
import { MarkdownFormatter } from './formatters/MarkdownFormatter.js';
import { ReportData } from './models/ReportData.js';

/**
 * Main entry point for the action
 */
class ReportParser {
  constructor() {
    this.parserFactory = new ParserFactory();
    this.summaryFormatter = new SummaryFormatter();
    this.markdownFormatter = new MarkdownFormatter();
  }

  /**
   * Parse command line arguments
   */
  parseArgs() {
    const args = process.argv.slice(2);
    return {
      reportPaths: args[0] || '',
      reportName: args[1] || 'Report Summary',
      includePassed: args[2] === 'true',
      outputFormat: args[3] || 'both'
    };
  }

  /**
   * Find report files based on glob patterns
   */
  async findReportFiles(patterns) {
    const patternList = patterns
      .split(/[,\n]/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const files = [];
    for (const pattern of patternList) {
      const matches = await glob(pattern, { nodir: true });
      files.push(...matches);
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Parse all report files
   */
  parseReports(files) {
    const aggregatedData = new ReportData();

    for (const file of files) {
      try {
        console.log(`Parsing ${file}...`);
        const content = readFileSync(file, 'utf-8');
        const reportData = this.parserFactory.parse(file, content);

        // Merge data
        aggregatedData.tests.push(...reportData.tests);
        aggregatedData.lintIssues.push(...reportData.lintIssues);
        
        if (reportData.coverage) {
          aggregatedData.setCoverage(reportData.coverage);
        }
      } catch (error) {
        console.error(`Error parsing ${file}: ${error.message}`);
        // Continue with other files
      }
    }

    return aggregatedData;
  }

  /**
   * Set GitHub Actions outputs
   */
  setOutputs(reportData, markdown, summary) {
    const outputs = {
      markdown: markdown.replace(/\n/g, '%0A'),
      summary: summary.replace(/\n/g, '%0A'),
      'total-tests': reportData.getTotalTests(),
      'passed-tests': reportData.getPassedCount(),
      'failed-tests': reportData.getFailedCount(),
      'skipped-tests': reportData.getSkippedCount(),
      'coverage-percentage': reportData.coverage ? reportData.coverage.getOverallPercentage().toFixed(2) : '0',
      'has-errors': reportData.hasErrors() ? 'true' : 'false'
    };

    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      let outputContent = '';
      for (const [key, value] of Object.entries(outputs)) {
        outputContent += `${key}=${value}\n`;
      }
      writeFileSync(outputFile, outputContent, { flag: 'a' });
    } else {
      // Fallback for local testing
      console.log('Outputs:', outputs);
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
        console.warn('No report files found');
        return;
      }

      // Parse reports
      const reportData = this.parseReports(files);

      // Generate outputs
      let markdown = '';
      let summary = '';

      if (args.outputFormat === 'markdown' || args.outputFormat === 'both') {
        markdown = this.markdownFormatter.format(reportData, args.reportName);
      }

      if (args.outputFormat === 'summary' || args.outputFormat === 'both') {
        summary = this.summaryFormatter.format(reportData, args.reportName, args.includePassed);
        // Write summary to temp file for the action to use
        writeFileSync('/tmp/test-report-summary.md', summary);
      }

      // Set outputs
      this.setOutputs(reportData, markdown, summary);

      console.log('\n--- Summary ---');
      console.log(`Total tests: ${reportData.getTotalTests()}`);
      console.log(`Passed: ${reportData.getPassedCount()}`);
      console.log(`Failed: ${reportData.getFailedCount()}`);
      console.log(`Skipped: ${reportData.getSkippedCount()}`);
      console.log(`Lint issues: ${reportData.lintIssues.length}`);
      if (reportData.coverage) {
        console.log(`Coverage: ${reportData.coverage.getOverallPercentage().toFixed(2)}%`);
      }

    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
}

// Run the parser
const parser = new ReportParser();
parser.run();
