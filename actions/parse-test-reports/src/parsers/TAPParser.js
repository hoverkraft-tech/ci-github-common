import { BaseParser } from './BaseParser.js';
import { ReportData, TestResult } from '../models/ReportData.js';

/**
 * Parser for TAP (Test Anything Protocol) format
 * Supports TAP versions 12, 13, and 14
 */
export class TAPParser extends BaseParser {
  canParse(filePath, content) {
    const lines = content.split('\n');
    // TAP files typically start with TAP version or test plan
    return lines.some(line => 
      line.trim().match(/^TAP version \d+/) ||
      line.trim().match(/^\d+\.\.\d+/) ||
      line.trim().match(/^(ok|not ok) \d+/)
    );
  }

  getPriority() {
    return 8;
  }

  parse(content, filePath) {
    const reportData = new ReportData();
    reportData.reportType = 'test';

    const lines = content.split('\n');
    let testNumber = 0;
    let currentSuite = filePath;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments (except directives)
      if (!line || (line.startsWith('#') && !line.includes('SKIP') && !line.includes('TODO'))) {
        continue;
      }

      // Parse test result line
      const match = line.match(/^(ok|not ok)\s+(\d+)?\s*-?\s*(.*)/);
      if (match) {
        const [, status, number, description] = match;
        testNumber = number ? parseInt(number) : testNumber + 1;

        const test = this._parseTestLine(status, description, testNumber, currentSuite);
        reportData.addTest(test);
      }
      // Parse suite name from comments
      else if (line.startsWith('# Subtest:')) {
        currentSuite = line.substring('# Subtest:'.length).trim();
      }
    }

    return reportData;
  }

  _parseTestLine(status, description, testNumber, suite) {
    let testStatus = status === 'ok' ? 'passed' : 'failed';
    let message = '';
    let name = description || `Test ${testNumber}`;

    // Check for SKIP directive
    if (description.includes('# SKIP')) {
      testStatus = 'skipped';
      const parts = description.split('# SKIP');
      name = parts[0].trim();
      message = parts[1] ? parts[1].trim() : 'Skipped';
    }
    // Check for TODO directive
    else if (description.includes('# TODO')) {
      testStatus = 'skipped';
      const parts = description.split('# TODO');
      name = parts[0].trim();
      message = parts[1] ? `TODO: ${parts[1].trim()}` : 'TODO';
    }
    // Extract failure message
    else if (testStatus === 'failed') {
      const parts = description.split('-');
      if (parts.length > 1) {
        name = parts[0].trim();
        message = parts.slice(1).join('-').trim();
      }
    }

    return new TestResult({
      name,
      status: testStatus,
      message,
      suite
    });
  }
}
