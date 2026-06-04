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
	 * Build glob patterns for file basenames matched anywhere in the workspace.
	 * @param {string[]} baseNames - File basenames to match
	 * @param {Object} [options] - Pattern options
	 * @param {boolean} [options.includePrefixed=false] - Also match *-prefixed variants
	 * @returns {string[]} Array of glob patterns
	 */
	buildBasenamePatterns(baseNames, { includePrefixed = false } = {}) {
		const patterns = [];

		for (const baseName of baseNames) {
			patterns.push(`**/${baseName}`);
			if (includePrefixed) {
				patterns.push(`**/*-${baseName}`);
			}
		}

		return patterns;
	}

	/**
	 * Build glob patterns for filenames within specific directories.
	 * @param {string} baseName - File basename to match
	 * @param {string[]} directories - Directory segments relative to any workspace folder
	 * @param {Object} [options] - Pattern options
	 * @param {boolean} [options.includePrefixed=false] - Also match *-prefixed variants
	 * @returns {string[]} Array of glob patterns
	 */
	buildScopedBasenamePatterns(
		baseName,
		directories,
		{ includePrefixed = false } = {},
	) {
		const patterns = [];

		for (const directory of directories) {
			patterns.push(`**/${directory}/${baseName}`);
			if (includePrefixed) {
				patterns.push(`**/${directory}/*-${baseName}`);
			}
		}

		return patterns;
	}

	/**
	 * Build extension-based glob patterns.
	 * @param {string[]} extensions - Extensions without the leading *.
	 * @returns {string[]} Array of glob patterns
	 */
	buildExtensionPatterns(extensions) {
		return extensions.map((extension) => `**/*.${extension}`);
	}

	/**
	 * Parse a report file
	 * @param {string} content - The file content
	 * @param {string} filePath - The file path for context
	 * @returns {ReportData} Parsed report data
	 */
	// eslint-disable-next-line no-unused-vars
	parse(_content, _filePath) {
		throw new Error("parse() must be implemented by subclass");
	}

	/**
	 * Check if this parser can handle the given file
	 * @param {string} filePath - The file path
	 * @param {string} content - The file content
	 * @returns {boolean} True if this parser can handle the file
	 */
	// eslint-disable-next-line no-unused-vars
	canParse(_filePath, _content) {
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
		throw new Error("getAutoPatterns() must be implemented by subclass");
	}
}
