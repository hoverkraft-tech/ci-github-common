/**
 * Auto-detection patterns for common report files
 */
const AUTO_PATTERNS = {
  test: [
    "**/junit*.xml",
    "**/test-results/**/*.xml",
    "**/test-reports/**/*.xml",
    "**/*test*.xml",
    "**/*.tap",
  ],
  coverage: [
    "**/coverage/lcov.info",
    "**/coverage/cobertura-coverage.xml",
    "**/coverage.xml",
    "**/lcov.info",
    "**/cobertura.xml",
  ],
  lint: [
    "**/eslint-report.json",
    "**/eslint.json",
    "**/checkstyle-result.xml",
    "**/checkstyle.xml",
  ],
};

/**
 * Component responsible for resolving report file paths
 */
export class ReportPathResolver {
  /**
   * Resolve report paths, handling auto-detection mode
   * @param {string} reportPaths - Raw report paths input
   * @param {Function} logger - Logger function
   * @returns {string[]} Array of glob patterns
   */
  resolvePatterns(reportPaths, logger = console.log) {
    let patternList = reportPaths
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Check for auto mode
    const autoMode = patternList.find((p) => p.startsWith("auto:"));
    if (autoMode) {
      const mode = autoMode.split(":")[1];
      logger(`Auto-detection mode: ${mode}`);

      patternList = [];
      if (mode === "all" || mode === "test") {
        patternList.push(...AUTO_PATTERNS.test);
      }
      if (mode === "all" || mode === "coverage") {
        patternList.push(...AUTO_PATTERNS.coverage);
      }
      if (mode === "all" || mode === "lint") {
        patternList.push(...AUTO_PATTERNS.lint);
      }

      logger(`Using patterns: ${patternList.join(", ")}`);
    }

    return patternList;
  }

  /**
   * Find files matching the patterns
   * @param {string[]} patterns - Array of glob patterns
   * @param {Object} globModule - Glob module from GitHub Actions
   * @returns {Promise<string[]>} Array of file paths
   */
  async findFiles(patterns, globModule) {
    const files = [];
    for (const pattern of patterns) {
      const globber = await globModule.create(pattern, {
        followSymbolicLinks: false,
      });
      const matches = await globber.glob();
      files.push(...matches);
    }

    // Remove duplicates
    return [...new Set(files)];
  }
}
