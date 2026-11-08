import { ReportCategory } from "./parsers/BaseParser.js";
import { ParserFactory } from "./parsers/ParserFactory.js";

const AUTO_MODE_ALL = "all";

/**
 * Component responsible for resolving report file paths
 */
export class ReportPathResolver {
	constructor(fileSystemService, logger) {
		this.fileSystemService = fileSystemService;
		this.logger = logger;
		this.parserFactory = new ParserFactory(fileSystemService);
	}

	/**
	 * Get the auto patterns map from parsers
	 * @returns {Object} Object with category keys and pattern arrays
	 */
	getAutoPatterns() {
		return this.parserFactory.getAutoPatternsMap();
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

		const autoPatterns = this.getAutoPatterns();
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
				for (const pattern of Object.values(autoPatterns).flat()) {
					patternList.add(pattern);
				}
				continue;
			}

			if (autoPatterns[normalizedMode] !== undefined) {
				for (const pattern of autoPatterns[normalizedMode]) {
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
			pattern.startsWith("!")
				? `!${this.fileSystemService.normalizeFilePath(pattern.slice(1))}`
				: this.fileSystemService.normalizeFilePath(pattern),
		);

		// Add exclusion pattern for node_modules
		normalizedPatterns.push("!**/node_modules/**");

		const globber = await globModule.create(normalizedPatterns.join("\n"), {
			followSymbolicLinks: false,
			matchDirectories: false,
		});

		const files = new Set();

		for await (const file of globber.globGenerator()) {
			files.add(this.fileSystemService.resolveFilePath(file));
		}

		return Array.from(files);
	}

	/** Require explicit positive patterns to match after applying exclusions. */
	async assertExplicitMatches(reportPaths, globModule) {
		const segments = reportPaths
			.split(/[,\n]/)
			.map((pattern) => pattern.trim());
		const exclusions = segments.filter((pattern) => pattern.startsWith("!"));
		const explicit = new Set(
			segments.filter(
				(pattern) =>
					pattern && !pattern.startsWith("auto:") && !pattern.startsWith("!"),
			),
		);
		for (const pattern of explicit) {
			const matches = await this.findFiles(
				[pattern, ...exclusions],
				globModule,
			);
			if (matches.length === 0) {
				throw new Error(`No report files matched explicit pattern: ${pattern}`);
			}
		}
	}
}

// Export ReportCategory for convenience
export { ReportCategory };
