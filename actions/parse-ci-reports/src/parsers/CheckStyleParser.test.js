import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CheckStyleParser } from "./CheckStyleParser.js";

const EMPTY_CHECKSTYLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<checkstyle version="10.0"></checkstyle>`;

const CHECKSTYLE_WITH_ISSUES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<checkstyle version="10.0">
	<file name="src/index.js">
		<error line="5" column="1" severity="warning" message="Unexpected console statement" source="no-console"/>
	</file>
</checkstyle>`;

describe("CheckStyleParser", () => {
	it("keeps auto-pattern path detection synchronized", () => {
		const parser = new CheckStyleParser();
		const filePath = "application/humanize-checkstyle-result.xml";

		assert.ok(parser.matchesAutoPatterns(filePath));
		assert.ok(parser.canParse(filePath, EMPTY_CHECKSTYLE_XML));
	});

	it("identifies valid checkstyle XML reports without file entries", () => {
		const parser = new CheckStyleParser();

		assert.ok(
			parser.canParse(
				"application/humanize-report-checkstyle.xml",
				EMPTY_CHECKSTYLE_XML,
			),
		);
	});

	it("parses empty checkstyle reports as zero lint issues", () => {
		const parser = new CheckStyleParser();

		const reportData = parser.parse(
			EMPTY_CHECKSTYLE_XML,
			"application/humanize-report-checkstyle.xml",
		);
		assert.strictEqual(reportData.lintIssues.length, 0);
	});

	it("parses checkstyle issues from file entries", () => {
		const parser = new CheckStyleParser();

		const reportData = parser.parse(
			CHECKSTYLE_WITH_ISSUES_XML,
			"checkstyle-result.xml",
		);

		assert.strictEqual(reportData.lintIssues.length, 1);
		assert.strictEqual(reportData.lintIssues[0].file, "src/index.js");
		assert.strictEqual(reportData.lintIssues[0].line, 5);
		assert.strictEqual(reportData.lintIssues[0].column, 1);
		assert.strictEqual(reportData.lintIssues[0].severity, "warning");
		assert.strictEqual(reportData.lintIssues[0].rule, "no-console");
	});
});
