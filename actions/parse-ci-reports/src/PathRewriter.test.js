import { describe, it } from "node:test";
import assert from "node:assert";
import { PathRewriter } from "./PathRewriter.js";

describe("PathRewriter", () => {
  it("should be disabled by default", () => {
    const rewriter = new PathRewriter();
    assert.strictEqual(rewriter.isEnabled(), false);
    assert.strictEqual(rewriter.rewritePath("/some/path.js"), "/some/path.js");
  });

  it("should parse single path mapping correctly", () => {
    const rewriter = new PathRewriter("/app/src:/workspace/src");
    assert.strictEqual(rewriter.isEnabled(), true);

    const mappings = rewriter.getMappings();
    assert.strictEqual(mappings.length, 1);
    assert.strictEqual(mappings[0].from, "/app/src");
    assert.strictEqual(mappings[0].to, "/workspace/src");
  });

  it("should parse multiple path mappings separated by newlines", () => {
    const rewriter = new PathRewriter(
      "/app/src:/workspace/src\n/app/tests:/workspace/tests",
    );
    assert.strictEqual(rewriter.isEnabled(), true);

    const mappings = rewriter.getMappings();
    assert.strictEqual(mappings.length, 2);
    assert.strictEqual(mappings[0].from, "/app/src");
    assert.strictEqual(mappings[0].to, "/workspace/src");
    assert.strictEqual(mappings[1].from, "/app/tests");
    assert.strictEqual(mappings[1].to, "/workspace/tests");
  });

  it("should parse multiple path mappings separated by commas", () => {
    const rewriter = new PathRewriter(
      "/app/src:/workspace/src,/app/tests:/workspace/tests",
    );
    assert.strictEqual(rewriter.isEnabled(), true);

    const mappings = rewriter.getMappings();
    assert.strictEqual(mappings.length, 2);
    assert.strictEqual(mappings[0].from, "/app/src");
    assert.strictEqual(mappings[0].to, "/workspace/src");
    assert.strictEqual(mappings[1].from, "/app/tests");
    assert.strictEqual(mappings[1].to, "/workspace/tests");
  });

  it("should rewrite paths using first matching mapping", () => {
    const rewriter = new PathRewriter(
      "/app/src:/workspace/src\n/app/tests:/workspace/tests",
    );

    assert.strictEqual(
      rewriter.rewritePath("/app/src/utils/helper.js"),
      "/workspace/src/utils/helper.js",
    );

    assert.strictEqual(
      rewriter.rewritePath("/app/tests/unit/test.js"),
      "/workspace/tests/unit/test.js",
    );
  });

  it("should use first matching mapping when multiple could match", () => {
    const rewriter = new PathRewriter(
      "/app/src:/workspace/src\n/app:/workspace",
    );

    // Should use first mapping that matches
    assert.strictEqual(
      rewriter.rewritePath("/app/src/file.js"),
      "/workspace/src/file.js",
    );

    // Should use second mapping when first doesn't match
    assert.strictEqual(
      rewriter.rewritePath("/app/other/file.js"),
      "/workspace/other/file.js",
    );
  });

  it("should handle paths without leading slash in fromPath", () => {
    const rewriter = new PathRewriter("/app/src:/workspace/src");

    assert.strictEqual(
      rewriter.rewritePath("app/src/utils/helper.js"),
      "/workspace/src/utils/helper.js",
    );
  });

  it("should not rewrite paths that don't match any mapping", () => {
    const rewriter = new PathRewriter("/app/src:/workspace/src");

    assert.strictEqual(
      rewriter.rewritePath("/other/path/file.js"),
      "/other/path/file.js",
    );
  });

  it("should handle empty or null paths", () => {
    const rewriter = new PathRewriter("/app/src:/workspace/src");

    assert.strictEqual(rewriter.rewritePath(""), "");
    assert.strictEqual(rewriter.rewritePath(null), null);
  });

  it("should normalize trailing slashes", () => {
    const rewriter = new PathRewriter("/app/src/:/workspace/src/");

    const mappings = rewriter.getMappings();
    assert.strictEqual(mappings[0].from, "/app/src");
    assert.strictEqual(mappings[0].to, "/workspace/src");
  });

  it("should throw error on invalid format", () => {
    assert.throws(() => {
      new PathRewriter("invalid-mapping");
    }, /Invalid path-mapping format/);

    assert.throws(() => {
      new PathRewriter("/from/path");
    }, /Invalid path-mapping format/);

    assert.throws(() => {
      new PathRewriter(":/to/path");
    }, /Paths cannot be empty/);
  });

  it("should handle complex paths", () => {
    const rewriter = new PathRewriter(
      "/var/lib/docker/overlay2/hash/merged/app:./src",
    );

    assert.strictEqual(
      rewriter.rewritePath(
        "/var/lib/docker/overlay2/hash/merged/app/utils/helper.js",
      ),
      "./src/utils/helper.js",
    );
  });

  it("should ignore empty lines and whitespace in multi-line mappings", () => {
    const rewriter = new PathRewriter(`
      /app/src:/workspace/src
      
      /app/tests:/workspace/tests
      
    `);

    const mappings = rewriter.getMappings();
    assert.strictEqual(mappings.length, 2);
    assert.strictEqual(mappings[0].from, "/app/src");
    assert.strictEqual(mappings[1].from, "/app/tests");
  });

  it("should handle mixed newlines and commas", () => {
    const rewriter = new PathRewriter(
      "/app/src:/workspace/src,/app/tests:/workspace/tests\n/app/lib:./lib",
    );

    const mappings = rewriter.getMappings();
    assert.strictEqual(mappings.length, 3);
    assert.strictEqual(mappings[0].from, "/app/src");
    assert.strictEqual(mappings[1].from, "/app/tests");
    assert.strictEqual(mappings[2].from, "/app/lib");
  });
});
