import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CoberturaParser } from "./CoberturaParser.js";

const SAMPLE_COBERTURA_XML = `<?xml version="1.0"?>
<coverage line-rate="0.75" branch-rate="0.5">
	<packages>
		<package name="app">
			<classes>
				<class name="App" filename="src/app.js">
					<lines>
						<line number="1" hits="1"/>
						<line number="2" hits="0"/>
					</lines>
				</class>
			</classes>
		</package>
	</packages>
</coverage>`;

describe("CoberturaParser", () => {
	it("keeps auto-pattern path detection synchronized", () => {
		const parser = new CoberturaParser();
		const filePath = "coverage/humanize-coverage.xml";

		assert.ok(parser.matchesAutoPatterns(filePath));
		assert.ok(parser.canParse(filePath, SAMPLE_COBERTURA_XML));
	});

	it("identifies Cobertura XML reports", () => {
		const parser = new CoberturaParser();

		assert.ok(parser.canParse("coverage/coverage.xml", SAMPLE_COBERTURA_XML));
		assert.ok(!parser.canParse("reports/report.txt", SAMPLE_COBERTURA_XML));
	});

	it("parses coverage totals", () => {
		const parser = new CoberturaParser();
		const reportData = parser.parse(SAMPLE_COBERTURA_XML, "coverage.xml");

		assert.ok(reportData.coverage);
		assert.strictEqual(reportData.coverage.lines.total, 2);
		assert.strictEqual(reportData.coverage.lines.covered, 1);
		assert.strictEqual(reportData.coverage.lines.percentage, 50);
	});
});
