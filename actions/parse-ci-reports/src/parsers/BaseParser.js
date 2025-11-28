/**
 * Report category constants
 */
export const ReportCategory = {
  TEST: "test",
  COVERAGE: "coverage",
  LINT: "lint",
};

/**
 * Base class for all report parsers
 * Follows the Strategy pattern for different report formats
 */
export class BaseParser {
  /**
   * Parse a report file
   * @param {string} content - The file content
   * @param {string} filePath - The file path for context
   * @returns {ReportData} Parsed report data
   */
  // eslint-disable-next-line no-unused-vars
  parse(content, filePath) {
    throw new Error("parse() must be implemented by subclass");
  }

  /**
   * Check if this parser can handle the given file
   * @param {string} filePath - The file path
   * @param {string} content - The file content
   * @returns {boolean} True if this parser can handle the file
   */
  // eslint-disable-next-line no-unused-vars
  canParse(filePath, content) {
    throw new Error("canParse() must be implemented by subclass");
  }

  /**
   * Get the priority of this parser (higher = more specific)
   * @returns {number} Priority value
   */
  getPriority() {
    return 0;
  }

  /**
   * Get the category of reports this parser handles
   * @returns {string} Report category (test, coverage, or lint)
   */
  getCategory() {
    throw new Error("getCategory() must be implemented by subclass");
  }

  /**
   * Get the glob patterns for auto-detecting files this parser can handle
   * @returns {string[]} Array of glob patterns
   */
  getAutoPatterns() {
    return [];
  }
}
