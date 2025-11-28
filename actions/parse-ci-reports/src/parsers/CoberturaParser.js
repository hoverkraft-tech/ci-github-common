import { XMLParser } from "fast-xml-parser";
import { BaseParser, ReportCategory } from "./BaseParser.js";
import { ReportData, Coverage } from "../models/ReportData.js";

/**
 * Parser for Cobertura XML coverage format
 * Commonly used by Java, Python, and other language coverage tools
 */
export class CoberturaParser extends BaseParser {
  constructor() {
    super();
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
  }

  canParse(filePath, content) {
    return (
      (filePath.toLowerCase().includes("cobertura") ||
        filePath.toLowerCase().includes("coverage")) &&
      content.includes("<coverage") &&
      content.includes("line-rate")
    );
  }

  getPriority() {
    return 9;
  }

  getCategory() {
    return ReportCategory.COVERAGE;
  }

  getAutoPatterns() {
    return [
      "**/coverage/cobertura-coverage.xml",
      "**/coverage.xml",
      "**/cobertura.xml",
    ];
  }

  parse(content) {
    const reportData = new ReportData();
    reportData.reportType = "coverage";

    try {
      const parsed = this.xmlParser.parse(content);
      const coverage = parsed.coverage;

      if (!coverage) {
        throw new Error("Invalid Cobertura format: missing coverage element");
      }

      const lineRate = parseFloat(coverage["@_line-rate"] || 0);
      const branchRate = parseFloat(coverage["@_branch-rate"] || 0);

      // Calculate totals from packages if available
      let totalLines = 0;
      let coveredLines = 0;
      let totalBranches = 0;
      let coveredBranches = 0;

      if (coverage.packages && coverage.packages.package) {
        const packages = Array.isArray(coverage.packages.package)
          ? coverage.packages.package
          : [coverage.packages.package];

        for (const pkg of packages) {
          const stats = this._calculatePackageStats(pkg);
          totalLines += stats.totalLines;
          coveredLines += stats.coveredLines;
          totalBranches += stats.totalBranches;
          coveredBranches += stats.coveredBranches;
        }
      }

      // Fallback to rates if totals not calculated
      if (totalLines === 0 && lineRate > 0) {
        totalLines = 100;
        coveredLines = Math.round(lineRate * 100);
      }

      if (totalBranches === 0 && branchRate > 0) {
        totalBranches = 100;
        coveredBranches = Math.round(branchRate * 100);
      }

      reportData.setCoverage(
        new Coverage({
          lines: {
            total: totalLines,
            covered: coveredLines,
            percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
          },
          branches: {
            total: totalBranches,
            covered: coveredBranches,
            percentage:
              totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
          },
        }),
      );
    } catch (error) {
      throw new Error(`Failed to parse Cobertura XML: ${error.message}`);
    }

    return reportData;
  }

  _calculatePackageStats(pkg) {
    let totalLines = 0;
    let coveredLines = 0;
    let totalBranches = 0;
    let coveredBranches = 0;

    if (pkg.classes && pkg.classes.class) {
      const classes = Array.isArray(pkg.classes.class)
        ? pkg.classes.class
        : [pkg.classes.class];

      for (const cls of classes) {
        if (cls.lines && cls.lines.line) {
          const lines = Array.isArray(cls.lines.line)
            ? cls.lines.line
            : [cls.lines.line];

          for (const line of lines) {
            totalLines++;
            const hits = parseInt(line["@_hits"] || 0);
            if (hits > 0) {
              coveredLines++;
            }

            // Branch coverage
            const branch = line["@_branch"] === "true";
            if (branch) {
              const conditionCoverage = line["@_condition-coverage"] || "0%";
              const match = conditionCoverage.match(/(\d+)\/(\d+)/);
              if (match) {
                const covered = parseInt(match[1]);
                const total = parseInt(match[2]);
                totalBranches += total;
                coveredBranches += covered;
              }
            }
          }
        }
      }
    }

    return { totalLines, coveredLines, totalBranches, coveredBranches };
  }
}
