import { JUnitParser } from "./JUnitParser.js";
import { TAPParser } from "./TAPParser.js";
import { CoberturaParser } from "./CoberturaParser.js";
import { LCOVParser } from "./LCOVParser.js";
import { ESLintParser } from "./ESLintParser.js";
import { CheckStyleParser } from "./CheckStyleParser.js";
import { PrettierParser } from "./PrettierParser.js";
import { AstroCheckParser } from "./AstroCheckParser.js";
import { ReportCategory } from "./BaseParser.js";

/**
 * Factory class for creating and managing parsers
 * Implements the Factory pattern for parser selection
 */
export class ParserFactory {
  constructor(fileSystemService) {
    this.fileSystemService = fileSystemService;

    this.parsers = [
      new JUnitParser(),
      new TAPParser(),
      new CoberturaParser(),
      new LCOVParser(),
      new ESLintParser(),
      new CheckStyleParser(),
      new PrettierParser(),
      new AstroCheckParser(),
    ];

    // Sort parsers by priority (highest first)
    this.parsers.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Get the appropriate parser for a file
   * @param {string} filePath - Path to the file
   * @param {string} content - File content
   * @returns {BaseParser|null} Parser instance or null if no parser found
   */
  getParser(filePath, content) {
    for (const parser of this.parsers) {
      if (parser.canParse(filePath, content)) {
        return parser;
      }
    }
    return null;
  }

  /**
   * Parse a file with the appropriate parser
   * @param {string} filePath - Path to the file
   * @param {string} content - File content
   * @returns {ReportData} Parsed report data
   */
  parse(filePath) {
    const content = this.fileSystemService.readFile(filePath);

    const parser = this.getParser(filePath, content);

    if (!parser) {
      throw new Error(`No parser found for file: ${filePath}`);
    }

    return parser.parse(content, filePath);
  }

  /**
   * Get auto-detection patterns for a specific category
   * @param {string} category - Report category (test, coverage, or lint)
   * @returns {string[]} Array of glob patterns
   */
  getAutoPatternsByCategory(category) {
    const patterns = [];
    for (const parser of this.parsers) {
      if (parser.getCategory() === category) {
        patterns.push(...parser.getAutoPatterns());
      }
    }
    return patterns;
  }

  /**
   * Get all auto-detection patterns from all parsers
   * @returns {string[]} Array of glob patterns
   */
  getAllAutoPatterns() {
    const patterns = [];
    for (const parser of this.parsers) {
      patterns.push(...parser.getAutoPatterns());
    }
    return patterns;
  }

  /**
   * Get auto-detection patterns grouped by category
   * @returns {Object} Object with category keys and pattern arrays
   */
  getAutoPatternsMap() {
    return {
      [ReportCategory.TEST]: this.getAutoPatternsByCategory(ReportCategory.TEST),
      [ReportCategory.COVERAGE]: this.getAutoPatternsByCategory(
        ReportCategory.COVERAGE,
      ),
      [ReportCategory.LINT]: this.getAutoPatternsByCategory(ReportCategory.LINT),
    };
  }
}
