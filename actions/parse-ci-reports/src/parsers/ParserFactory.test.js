import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ParserFactory } from "./ParserFactory.js";
import { ReportCategory } from "./BaseParser.js";

describe("ParserFactory", () => {
  const factory = new ParserFactory({});

  it("returns test patterns from test parsers", () => {
    const testPatterns = factory.getAutoPatternsByCategory(ReportCategory.TEST);

    // JUnitParser patterns
    assert.ok(testPatterns.includes("**/junit*.xml"));
    assert.ok(testPatterns.includes("**/test-results/**/*.xml"));
    assert.ok(testPatterns.includes("**/test-reports/**/*.xml"));
    assert.ok(testPatterns.includes("**/*test*.xml"));

    // TAPParser patterns
    assert.ok(testPatterns.includes("**/*.tap"));
  });

  it("returns coverage patterns from coverage parsers", () => {
    const coveragePatterns = factory.getAutoPatternsByCategory(
      ReportCategory.COVERAGE,
    );

    // LCOVParser patterns
    assert.ok(coveragePatterns.includes("**/coverage/lcov.info"));
    assert.ok(coveragePatterns.includes("**/lcov.info"));

    // CoberturaParser patterns
    assert.ok(coveragePatterns.includes("**/coverage/cobertura-coverage.xml"));
    assert.ok(coveragePatterns.includes("**/coverage.xml"));
    assert.ok(coveragePatterns.includes("**/cobertura.xml"));
  });

  it("returns lint patterns from lint parsers", () => {
    const lintPatterns = factory.getAutoPatternsByCategory(ReportCategory.LINT);

    // ESLintParser patterns
    assert.ok(lintPatterns.includes("**/eslint-report.json"));
    assert.ok(lintPatterns.includes("**/eslint.json"));

    // CheckStyleParser patterns
    assert.ok(lintPatterns.includes("**/checkstyle-result.xml"));
    assert.ok(lintPatterns.includes("**/checkstyle.xml"));

    // PrettierParser patterns
    assert.ok(lintPatterns.includes("**/prettier-check.log"));
    assert.ok(lintPatterns.includes("**/prettier-check.txt"));
    assert.ok(lintPatterns.includes("**/prettier-report.log"));
    assert.ok(lintPatterns.includes("**/prettier-report.txt"));

    // AstroCheckParser patterns
    assert.ok(lintPatterns.includes("**/astro-check.log"));
    assert.ok(lintPatterns.includes("**/astro-check.txt"));
    assert.ok(lintPatterns.includes("**/astro-check-report.log"));
    assert.ok(lintPatterns.includes("**/astro-check-report.txt"));
  });

  it("returns all patterns across all categories", () => {
    const allPatterns = factory.getAllAutoPatterns();

    // Should include patterns from all categories
    assert.ok(allPatterns.includes("**/junit*.xml")); // test
    assert.ok(allPatterns.includes("**/coverage/lcov.info")); // coverage
    assert.ok(allPatterns.includes("**/eslint-report.json")); // lint

    // Should have the total expected count
    // Test: 5, Coverage: 5, Lint: 12
    assert.strictEqual(allPatterns.length, 22);
  });

  it("returns patterns grouped by category", () => {
    const patternsMap = factory.getAutoPatternsMap();

    assert.ok(patternsMap[ReportCategory.TEST]);
    assert.ok(patternsMap[ReportCategory.COVERAGE]);
    assert.ok(patternsMap[ReportCategory.LINT]);

    assert.ok(patternsMap.test.length > 0);
    assert.ok(patternsMap.coverage.length > 0);
    assert.ok(patternsMap.lint.length > 0);
  });
});
