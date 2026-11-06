import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LCOVParser } from "./LCOVParser.js";

const SAMPLE_LCOV = `TN:
SF:src/app.js
DA:1,1
DA:2,0
FNDA:1,handler
BRDA:2,0,0,1
BRDA:2,0,1,0
end_of_record
`;

const SAMPLE_LCOV_WITHOUT_TEST_NAME = `SF:lib/main.dart
DA:1,1
DA:2,0
LF:2
LH:1
end_of_record
`;

describe("LCOVParser", () => {
	it("keeps auto-pattern path detection synchronized", () => {
		const parser = new LCOVParser();
		const filePath = "coverage/humanize-lcov.info";

		assert.ok(parser.matchesAutoPatterns(filePath));
		assert.ok(parser.canParse(filePath, SAMPLE_LCOV));
	});

	it("identifies LCOV reports", () => {
		const parser = new LCOVParser();

		assert.ok(parser.canParse("coverage/lcov.info", SAMPLE_LCOV));
		assert.ok(
			parser.canParse(
				"flutter/coverage/lcov.info",
				SAMPLE_LCOV_WITHOUT_TEST_NAME,
			),
		);
		assert.ok(!parser.canParse("coverage/report.txt", SAMPLE_LCOV));
	});

	it("parses line, function, and branch coverage", () => {
		const parser = new LCOVParser();
		const reportData = parser.parse(SAMPLE_LCOV, "lcov.info");

		assert.ok(reportData.coverage);
		assert.strictEqual(reportData.coverage.lines.total, 2);
		assert.strictEqual(reportData.coverage.lines.covered, 1);
		assert.strictEqual(reportData.coverage.functions.total, 1);
		assert.strictEqual(reportData.coverage.functions.covered, 1);
		assert.strictEqual(reportData.coverage.branches.total, 2);
		assert.strictEqual(reportData.coverage.branches.covered, 1);
	});
});
