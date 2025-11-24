const AUTO_MODE_ALL = "all";
const AUTO_MODE_TEST = "test";
const AUTO_MODE_COVERAGE = "coverage";
const AUTO_MODE_LINT = "lint";

/**
 * Auto-detection patterns for common report files
 */
const AUTO_PATTERNS = {
  [AUTO_MODE_TEST]: [
    "**/junit*.xml",
    "**/test-results/**/*.xml",
    "**/test-reports/**/*.xml",
    "**/*test*.xml",
    "**/*.tap",
  ],
  [AUTO_MODE_COVERAGE]: [
    "**/coverage/lcov.info",
    "**/coverage/cobertura-coverage.xml",
    "**/coverage.xml",
    "**/lcov.info",
    "**/cobertura.xml",
  ],
  [AUTO_MODE_LINT]: [
    "**/eslint-report.json",
    "**/eslint.json",
    "**/checkstyle-result.xml",
    "**/checkstyle.xml",
    "**/prettier-check.log",
    "**/prettier-check.txt",
    "**/prettier-report.log",
    "**/prettier-report.txt",
    "**/astro-check.log",
    "**/astro-check.txt",
    "**/astro-check-report.log",
    "**/astro-check-report.txt",
  ],
};

/**
 * Component responsible for resolving report file paths
 */
export class ReportPathResolver {
  constructor(fileSystemService, logger) {
    this.fileSystemService = fileSystemService;
    this.logger = logger;
  }

  /**
   * Resolve report paths, handling auto-detection mode
   * @param {string} reportPaths - Raw report paths input
   * @returns {string[]} Array of glob patterns
   */
  resolvePatterns(reportPaths) {
    const segments = reportPaths
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const patternList = new Set();
    for (const segment of segments) {
      const isAuto = segment.startsWith("auto:");
      if (!isAuto) {
        patternList.add(segment);
        continue;
      }

      const [, mode = ""] = segment.split(":");
      const normalizedMode = mode.trim();
      if (!normalizedMode) {
        throw new Error("Auto-detection mode must be specified");
      }

      this.logger.info(`Auto-detection mode: ${normalizedMode}`);

      if (normalizedMode === AUTO_MODE_ALL) {
        for (const pattern of Object.values(AUTO_PATTERNS).flat()) {
          patternList.add(pattern);
        }
        continue;
      }

      if (AUTO_PATTERNS[normalizedMode] !== undefined) {
        for (const pattern of AUTO_PATTERNS[normalizedMode]) {
          patternList.add(pattern);
        }
        continue;
      }

      throw new Error(`Unknown auto-detection mode: ${normalizedMode}`);
    }

    const patternsArray = Array.from(patternList);
    this.logger.info(`Using patterns: ${patternsArray.join(", ")}`);
    return patternsArray;
  }

  /**
   * Find files matching the patterns
   * @param {string[]} patterns - Array of glob patterns
   * @param {Object} globModule - Glob module from GitHub Actions
   * @returns {Promise<string[]>} Array of file paths
   */
  async findFiles(patterns, globModule) {
    const normalizedPatterns = patterns.map((pattern) =>
      this.fileSystemService.normalizeFilePath(pattern),
    );

    // Add exclusion pattern for node_modules
    normalizedPatterns.push("!**/node_modules/**");

    const globber = await globModule.create(normalizedPatterns.join("\n"), {
      followSymbolicLinks: false,
    });

    const files = new Set();

    for await (const file of globber.globGenerator()) {
      files.add(this.fileSystemService.resolveFilePath(file));
    }

    return Array.from(files);
  }
}
