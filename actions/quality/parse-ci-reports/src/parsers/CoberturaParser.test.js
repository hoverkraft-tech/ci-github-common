import assert from "node:assert/strict";
import { describe, it, suite, test } from "node:test";
import { CoberturaParser } from "./CoberturaParser.js";

test("aggregate coverage uses native counts, never a synthetic denominator", () => {
	const parser = new CoberturaParser();
	const declared = parser.parse(
		'<coverage line-rate="0.5" lines-valid="6" lines-covered="3"/>',
	);
	assert.equal(declared.coverage.lines.total, 6);
	assert.equal(declared.coverage.lines.covered, 3);
	const rateOnly = parser.parse('<coverage line-rate="0.5" branch-rate="1"/>');
	assert.equal(rateOnly.coverage.lines.total, 0);
	assert.equal(rateOnly.coverage.branches.total, 0);
	assert.throws(
		() => parser.parse('<coverage lines-valid="2" lines-covered="3"/>'),
		/counts/,
	);
});

suite("Cobertura auto-detection", () => {
	for (const file of ["cobertura.xml", ".reports/cobertura.xml"]) {
		test(`discovers ${file} outside a coverage directory`, () => {
			// Arrange
			const parser = new CoberturaParser();

			// Act
			const detected = parser.matchesAutoPatterns(file);

			// Assert
			assert.ok(detected);
		});
	}
});

test("exact branch aggregates retain branches without a statement line and reject contradictions", () => {
	const parser = new CoberturaParser();
	const xml =
		'<coverage branches-valid="5" branches-covered="3"><packages><package><classes><class filename="index.js"><lines><line number="1" hits="1" branch="true" condition-coverage="50% (1/2)"/></lines></class></classes></package></packages></coverage>';
	assert.deepEqual(parser.parse(xml).coverage.branches, {
		total: 5,
		covered: 3,
		percentage: 60,
	});
	assert.throws(
		() => parser.parse(xml.replace('branches-valid="5"', 'branches-valid="1"')),
		/counts/,
	);
	assert.throws(
		() =>
			parser.parse(xml.replace('branches-covered="3"', 'branches-covered="5"')),
		/contradict/,
	);
});

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
