import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ReportPathResolver } from "./ReportPathResolver.js";

const createFileSystemStub = () => {
  const normalized = [];
  const resolved = [];

  return {
    normalized,
    resolved,
    normalizeFilePath(pattern) {
      normalized.push(pattern);
      return `normalized:${pattern}`;
    },
    resolveFilePath(match) {
      resolved.push(match);
      return `resolved:${match}`;
    },
  };
};

const createLoggerStub = () => ({
  messages: [],
  info(message) {
    this.messages.push(message);
  },
});

describe("ReportPathResolver", () => {
  it("normalizes glob patterns before passing them to glob", async () => {
    const fileSystem = createFileSystemStub();
    const logger = createLoggerStub();
    const resolver = new ReportPathResolver(fileSystem, logger);
    const createdPatterns = [];

    const globModule = {
      async create(patternsString) {
        createdPatterns.push(patternsString);
        return {
          async *globGenerator() {
            yield "match-a";
            yield "match-b";
          },
        };
      },
    };

    const files = await resolver.findFiles(["coverage/**/*.xml"], globModule);

    assert.deepStrictEqual(createdPatterns, [
      "normalized:coverage/**/*.xml\n!**/node_modules/**",
    ]);
    assert.deepStrictEqual(files, ["resolved:match-a", "resolved:match-b"]);
    assert.deepStrictEqual(fileSystem.normalized, ["coverage/**/*.xml"]);
    assert.deepStrictEqual(fileSystem.resolved, ["match-a", "match-b"]);
  });

  it("deduplicates resolved matches", async () => {
    const fileSystem = createFileSystemStub();
    const logger = createLoggerStub();
    const resolver = new ReportPathResolver(fileSystem, logger);

    const globModule = {
      async create() {
        return {
          async *globGenerator() {
            yield "match-a";
            yield "match-a";
            yield "match-b";
          },
        };
      },
    };

    const files = await resolver.findFiles(["pattern"], globModule);
    assert.deepStrictEqual(files, ["resolved:match-a", "resolved:match-b"]);
  });

  it("merges multiple auto modes in declaration order", () => {
    const logger = createLoggerStub();
    const resolver = new ReportPathResolver({}, logger);

    const patterns = resolver.resolvePatterns("auto:test, auto:coverage");

    assert.deepStrictEqual(patterns, [
      "**/junit*.xml",
      "**/test-results/**/*.xml",
      "**/test-reports/**/*.xml",
      "**/*test*.xml",
      "**/*.tap",
      "**/coverage/lcov.info",
      "**/coverage/cobertura-coverage.xml",
      "**/coverage.xml",
      "**/lcov.info",
      "**/cobertura.xml",
    ]);
  });

  it("deduplicates overlapping auto modes", () => {
    const logger = createLoggerStub();
    const resolver = new ReportPathResolver({}, logger);

    const patterns = resolver.resolvePatterns("auto:lint,auto:all");

    assert.deepStrictEqual(patterns, [
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
      "**/junit*.xml",
      "**/test-results/**/*.xml",
      "**/test-reports/**/*.xml",
      "**/*test*.xml",
      "**/*.tap",
      "**/coverage/lcov.info",
      "**/coverage/cobertura-coverage.xml",
      "**/coverage.xml",
      "**/lcov.info",
      "**/cobertura.xml",
    ]);
  });

  it("excludes node_modules files from glob patterns", async () => {
    const fileSystem = createFileSystemStub();
    const logger = createLoggerStub();
    const resolver = new ReportPathResolver(fileSystem, logger);
    const createdPatterns = [];

    const globModule = {
      async create(patternsString) {
        createdPatterns.push(patternsString);
        return {
          async *globGenerator() {
            // Simulate glob behavior: return files, but node_modules should be excluded by pattern
            yield "src/test.xml";
            yield "coverage/report.xml";
            // This would be excluded by the !**/node_modules/** pattern in real glob
            // but for this test, we just verify the pattern is passed
          },
        };
      },
    };

    const files = await resolver.findFiles(["**/*.xml"], globModule);

    // Verify that the exclusion pattern is added
    assert.ok(
      createdPatterns[0].includes("!**/node_modules/**"),
      "Should include node_modules exclusion pattern",
    );
    assert.deepStrictEqual(files, [
      "resolved:src/test.xml",
      "resolved:coverage/report.xml",
    ]);
  });
});
