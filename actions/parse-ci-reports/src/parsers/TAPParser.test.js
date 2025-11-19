import { describe, it } from "node:test";
import assert from "node:assert";
import { TAPParser } from "./TAPParser.js";

describe("TAPParser", () => {
  const parser = new TAPParser();

  it("should identify TAP format", () => {
    const content = `TAP version 13
1..3
ok 1 - test passed
not ok 2 - test failed
ok 3 - test passed # SKIP`;

    assert.strictEqual(parser.canParse("test.tap", content), true);
  });

  it("should parse basic TAP output", () => {
    const content = `TAP version 13
1..3
ok 1 - test one
not ok 2 - test two
ok 3 - test three`;

    const result = parser.parse(content, "test.tap");
    verifyBasicCounts(result, 3, 2, 1);
  });

  it("should parse skipped tests", () => {
    const content = `1..2
ok 1 - test one
ok 2 - test two # SKIP not implemented`;

    const result = parser.parse(content, "test.tap");

    assert.strictEqual(result.getTotalTests(), 2);
    assert.strictEqual(result.getPassedCount(), 1);
    assert.strictEqual(result.getSkippedCount(), 1);

    const skippedTest = result.getSkippedTests()[0];
    assert.strictEqual(skippedTest.message, "not implemented");
  });

  it("should parse TODO tests", () => {
    const content = `1..1
not ok 1 - test one # TODO fix later`;

    const result = parser.parse(content, "test.tap");

    assert.strictEqual(result.getSkippedCount(), 1);
    assert.ok(result.getSkippedTests()[0].message.includes("TODO"));
  });

  it("should handle tests without numbers", () => {
    const content = `ok - first test
ok - second test
not ok - third test`;

    const result = parser.parse(content, "test.tap");
    verifyBasicCounts(result, 3, 2, 1);
  });
});

function verifyBasicCounts(result, total, passed, failed) {
  assert.strictEqual(result.getTotalTests(), total);
  assert.strictEqual(result.getPassedCount(), passed);
  assert.strictEqual(result.getFailedCount(), failed);
}
