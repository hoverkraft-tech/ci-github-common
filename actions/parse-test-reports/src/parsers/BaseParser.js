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
  parse(content, filePath) {
    throw new Error('parse() must be implemented by subclass');
  }

  /**
   * Check if this parser can handle the given file
   * @param {string} filePath - The file path
   * @param {string} content - The file content
   * @returns {boolean} True if this parser can handle the file
   */
  canParse(filePath, content) {
    throw new Error('canParse() must be implemented by subclass');
  }

  /**
   * Get the priority of this parser (higher = more specific)
   * @returns {number} Priority value
   */
  getPriority() {
    return 0;
  }
}
