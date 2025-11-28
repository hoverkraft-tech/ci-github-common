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

  it("returns test and coverage patterns for auto:test and auto:coverage", () => {
    const logger = createLoggerStub();
    const resolver = new ReportPathResolver({}, logger);

    const patterns = resolver.resolvePatterns("auto:test, auto:coverage");

    // Verify test patterns are included (from JUnitParser and TAPParser)
    const testPatterns = [
      "**/junit*.xml",
      "**/test-results/**/*.xml",
      "**/test-reports/**/*.xml",
      "**/*test*.xml",
      "**/*.tap",
    ];
    for (const pattern of testPatterns) {
      assert.ok(
        patterns.includes(pattern),
        `Missing test pattern: ${pattern}`,
      );
    }

    // Verify coverage patterns are included (from LCOVParser and CoberturaParser)
    const coveragePatterns = [
      "**/coverage/lcov.info",
      "**/lcov.info",
      "**/coverage/cobertura-coverage.xml",
      "**/coverage.xml",
      "**/cobertura.xml",
    ];
    for (const pattern of coveragePatterns) {
      assert.ok(
        patterns.includes(pattern),
        `Missing coverage pattern: ${pattern}`,
      );
    }

    // Verify no lint patterns are included
    const lintPatterns = ["**/eslint-report.json", "**/checkstyle.xml"];
    for (const pattern of lintPatterns) {
      assert.ok(
        !patterns.includes(pattern),
        `Should not include lint pattern: ${pattern}`,
      );
    }

    // Verify total count matches expected (5 test + 5 coverage)
    assert.strictEqual(patterns.length, 10);
  });

  it("deduplicates overlapping auto modes", () => {
    const logger = createLoggerStub();
    const resolver = new ReportPathResolver({}, logger);

    const patterns = resolver.resolvePatterns("auto:lint,auto:all");

    // All lint patterns should be included
    const lintPatterns = [
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
    ];
    for (const pattern of lintPatterns) {
      assert.ok(
        patterns.includes(pattern),
        `Missing lint pattern: ${pattern}`,
      );
    }

    // All test patterns should be included
    const testPatterns = [
      "**/junit*.xml",
      "**/test-results/**/*.xml",
      "**/test-reports/**/*.xml",
      "**/*test*.xml",
      "**/*.tap",
    ];
    for (const pattern of testPatterns) {
      assert.ok(
        patterns.includes(pattern),
        `Missing test pattern: ${pattern}`,
      );
    }

    // All coverage patterns should be included
    const coveragePatterns = [
      "**/coverage/lcov.info",
      "**/lcov.info",
      "**/coverage/cobertura-coverage.xml",
      "**/coverage.xml",
      "**/cobertura.xml",
    ];
    for (const pattern of coveragePatterns) {
      assert.ok(
        patterns.includes(pattern),
        `Missing coverage pattern: ${pattern}`,
      );
    }

    // Verify deduplication - total should be 12 lint + 5 test + 5 coverage = 22
    assert.strictEqual(patterns.length, 22);
  });

  it("gets patterns from parsers via getAutoPatterns", () => {
    const logger = createLoggerStub();
    const resolver = new ReportPathResolver({}, logger);

    const autoPatterns = resolver.getAutoPatterns();

    // Verify structure
    assert.ok(autoPatterns.test, "Should have test patterns");
    assert.ok(autoPatterns.coverage, "Should have coverage patterns");
    assert.ok(autoPatterns.lint, "Should have lint patterns");

    // Verify test patterns come from JUnitParser and TAPParser
    assert.ok(autoPatterns.test.includes("**/junit*.xml"));
    assert.ok(autoPatterns.test.includes("**/*.tap"));

    // Verify coverage patterns come from LCOVParser and CoberturaParser
    assert.ok(autoPatterns.coverage.includes("**/coverage/lcov.info"));
    assert.ok(autoPatterns.coverage.includes("**/cobertura.xml"));

    // Verify lint patterns come from ESLintParser, CheckStyleParser, PrettierParser, AstroCheckParser
    assert.ok(autoPatterns.lint.includes("**/eslint-report.json"));
    assert.ok(autoPatterns.lint.includes("**/checkstyle.xml"));
    assert.ok(autoPatterns.lint.includes("**/prettier-check.log"));
    assert.ok(autoPatterns.lint.includes("**/astro-check.log"));
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
