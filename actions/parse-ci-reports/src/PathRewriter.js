/**
 * PathRewriter - Utility to rewrite file paths in reports
 *
 * This is useful when tests/lints run in a different directory or container,
 * but the paths in reports need to match the actual repository structure
 * for GitHub annotations and file references to work correctly.
 */
export class PathRewriter {
  /**
   * Create a path rewriter
   * @param {string|null} pathMapping - Path mapping in format "from:to" or null to disable
   */
  constructor(pathMapping = null) {
    this.fromPath = null;
    this.toPath = null;

    if (pathMapping && pathMapping.trim().length > 0) {
      this._parsePathMapping(pathMapping);
    }
  }

  /**
   * Parse path mapping string
   * @param {string} pathMapping - Path mapping in format "from:to"
   * @private
   */
  _parsePathMapping(pathMapping) {
    const parts = pathMapping.split(":");
    if (parts.length !== 2) {
      throw new Error(
        `Invalid path-mapping format: "${pathMapping}". Expected format: "from_path:to_path"`,
      );
    }

    this.fromPath = parts[0].trim();
    this.toPath = parts[1].trim();

    if (this.fromPath.length === 0 || this.toPath.length === 0) {
      throw new Error(
        `Invalid path-mapping format: "${pathMapping}". Paths cannot be empty.`,
      );
    }

    // Normalize paths - remove trailing slashes for consistency
    this.fromPath = this.fromPath.replace(/\/+$/, "");
    this.toPath = this.toPath.replace(/\/+$/, "");
  }

  /**
   * Check if path rewriting is enabled
   * @returns {boolean} True if path mapping is configured
   */
  isEnabled() {
    return this.fromPath !== null && this.toPath !== null;
  }

  /**
   * Rewrite a file path
   * @param {string} path - Original path from report
   * @returns {string} Rewritten path or original if no mapping configured
   */
  rewritePath(path) {
    if (!this.isEnabled() || !path) {
      return path;
    }

    // Handle both absolute and relative paths
    let normalizedPath = path;

    // If path starts with fromPath, replace it
    if (normalizedPath.startsWith(this.fromPath)) {
      normalizedPath =
        this.toPath + normalizedPath.substring(this.fromPath.length);
    }
    // Also handle case where fromPath has leading slash but path doesn't
    else if (normalizedPath.startsWith(this.fromPath.replace(/^\//, ""))) {
      const fromPathNoLeadingSlash = this.fromPath.replace(/^\//, "");
      normalizedPath =
        this.toPath + normalizedPath.substring(fromPathNoLeadingSlash.length);
    }

    return normalizedPath;
  }

  /**
   * Get info about the path mapping configuration
   * @returns {Object|null} Object with from and to paths, or null if not enabled
   */
  getMapping() {
    if (!this.isEnabled()) {
      return null;
    }

    return {
      from: this.fromPath,
      to: this.toPath,
    };
  }
}
