import { BaseParser, ReportCategory } from "./BaseParser.js";
import { ReportData, Coverage } from "../models/ReportData.js";

/**
 * Parser for LCOV coverage format
 * Commonly used by JavaScript/Node.js coverage tools
 */
export class LCOVParser extends BaseParser {
  canParse(filePath, content) {
    return (
      (filePath.toLowerCase().includes("lcov") || filePath.endsWith(".info")) &&
      content.includes("TN:") &&
      (content.includes("SF:") || content.includes("DA:"))
    );
  }

  getPriority() {
    return 9;
  }

  getCategory() {
    return ReportCategory.COVERAGE;
  }

  getAutoPatterns() {
    return ["**/coverage/lcov.info", "**/lcov.info"];
  }

  parse(content) {
    const reportData = new ReportData();
    reportData.reportType = "coverage";

    const lines = content.split("\n");
    let totalLines = 0;
    let coveredLines = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalBranches = 0;
    let coveredBranches = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Line coverage: DA:<line number>,<hit count>
      if (trimmed.startsWith("DA:")) {
        totalLines++;
        const parts = trimmed.substring(3).split(",");
        const hits = parseInt(parts[1] || 0);
        if (hits > 0) {
          coveredLines++;
        }
      }
      // Function coverage: FNDA:<hit count>,<function name>
      else if (trimmed.startsWith("FNDA:")) {
        totalFunctions++;
        const parts = trimmed.substring(5).split(",");
        const hits = parseInt(parts[0] || 0);
        if (hits > 0) {
          coveredFunctions++;
        }
      }
      // Branch coverage: BRDA:<line>,<block>,<branch>,<taken>
      else if (trimmed.startsWith("BRDA:")) {
        totalBranches++;
        const parts = trimmed.substring(5).split(",");
        const taken = parts[3];
        if (taken !== "-" && parseInt(taken) > 0) {
          coveredBranches++;
        }
      }
      // Summary lines (LF, LH, FNF, FNH, BRF, BRH)
      else if (trimmed.startsWith("LF:")) {
        // Lines found - can be used as a fallback
      } else if (trimmed.startsWith("LH:")) {
        // Lines hit - can be used as a fallback
      }
    }

    reportData.setCoverage(
      new Coverage({
        lines: {
          total: totalLines,
          covered: coveredLines,
          percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
        },
        functions: {
          total: totalFunctions,
          covered: coveredFunctions,
          percentage:
            totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
        },
        branches: {
          total: totalBranches,
          covered: coveredBranches,
          percentage:
            totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
        },
      }),
    );

    return reportData;
  }
}
