/**
 * PathRewriter - Utility to rewrite file paths in reports
 *
 * This is useful when tests/lints run in a different directory or container,
 * but the paths in reports need to match the actual repository structure
 * for GitHub annotations and file references to work correctly.
 */
const SLASH_CHAR_CODE = "/".charCodeAt(0);

const trimTrailingSlashes = (value) => {
  if (!value) {
    return value;
  }

  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === SLASH_CHAR_CODE) {
    end -= 1;
  }

  return value.slice(0, end);
};

const removeSingleLeadingSlash = (value) => {
  if (!value || value.charCodeAt(0) !== SLASH_CHAR_CODE) {
    return value;
  }

  return value.slice(1);
};

export class PathRewriter {
  /**
   * Create a path rewriter
   * @param {string|null} pathMapping - Path mapping(s) in format "from:to" or multiple mappings separated by newlines/commas
   */
  constructor(pathMapping = null) {
    this.mappings = [];

    if (pathMapping && pathMapping.trim().length > 0) {
      this._parsePathMappings(pathMapping);
    }
  }

  /**
   * Parse path mapping string(s)
   * @param {string} pathMapping - Path mapping(s) in format "from:to", can be multiple separated by newlines or commas
   * @private
   */
  _parsePathMappings(pathMapping) {
    // Split by newlines or commas, filter empty strings
    const lines = pathMapping
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const line of lines) {
      const parts = line.split(":");
      if (parts.length !== 2) {
        throw new Error(
          `Invalid path-mapping format: "${line}". Expected format: "from_path:to_path"`,
        );
      }

      const fromPath = parts[0].trim();
      const toPath = parts[1].trim();

      if (fromPath.length === 0 || toPath.length === 0) {
        throw new Error(
          `Invalid path-mapping format: "${line}". Paths cannot be empty.`,
        );
      }

      // Normalize paths - remove trailing slashes for consistency
      this.mappings.push({
        from: trimTrailingSlashes(fromPath),
        to: trimTrailingSlashes(toPath),
      });
    }
  }

  /**
   * Check if path rewriting is enabled
   * @returns {boolean} True if path mapping is configured
   */
  isEnabled() {
    return this.mappings.length > 0;
  }

  /**
   * Rewrite a file path using the first matching mapping
   * @param {string} path - Original path from report
   * @returns {string} Rewritten path or original if no mapping matches
   */
  rewritePath(path) {
    if (!this.isEnabled() || !path) {
      return path;
    }

    // Try each mapping in order until one matches
    for (const mapping of this.mappings) {
      const result = this._applyMapping(path, mapping);
      if (result !== path) {
        // Mapping was applied
        return result;
      }
    }

    // No mapping matched, return original
    return path;
  }

  /**
   * Apply a single mapping to a path
   * @param {string} path - Original path
   * @param {Object} mapping - Mapping object with from and to properties
   * @returns {string} Rewritten path or original if mapping doesn't match
   * @private
   */
  _applyMapping(path, mapping) {
    // If path starts with fromPath, replace it
    if (path.startsWith(mapping.from)) {
      return mapping.to + path.substring(mapping.from.length);
    }

    if (mapping.from.startsWith("/")) {
      const fromPathNoLeadingSlash = removeSingleLeadingSlash(mapping.from);
      if (path.startsWith(fromPathNoLeadingSlash)) {
        return mapping.to + path.substring(fromPathNoLeadingSlash.length);
      }
    }

    return path;
  }

  /**
   * Get info about the path mapping configuration
   * @returns {Array|null} Array of mapping objects with from and to properties, or null if not enabled
   */
  getMappings() {
    if (!this.isEnabled()) {
      return null;
    }

    return this.mappings.map((m) => ({
      from: m.from,
      to: m.to,
    }));
  }
}
