import { describe, it } from "node:test";
import assert from "node:assert";
import { PathRewriter } from "./PathRewriter.js";

describe("PathRewriter", () => {
  it("should be disabled by default", () => {
    const rewriter = new PathRewriter();
    assert.strictEqual(rewriter.isEnabled(), false);
    assert.strictEqual(rewriter.rewritePath("/some/path.js"), "/some/path.js");
  });

  it("should parse path mapping correctly", () => {
    const rewriter = new PathRewriter("/app/src:/workspace/src");
    assert.strictEqual(rewriter.isEnabled(), true);

    const mapping = rewriter.getMapping();
    assert.strictEqual(mapping.from, "/app/src");
    assert.strictEqual(mapping.to, "/workspace/src");
  });

  it("should rewrite paths correctly", () => {
    const rewriter = new PathRewriter("/app/src:/workspace/src");

    assert.strictEqual(
      rewriter.rewritePath("/app/src/utils/helper.js"),
      "/workspace/src/utils/helper.js",
    );

    assert.strictEqual(
      rewriter.rewritePath("/app/src/index.js"),
      "/workspace/src/index.js",
    );
  });

  it("should handle paths without leading slash in fromPath", () => {
    const rewriter = new PathRewriter("/app/src:/workspace/src");

    assert.strictEqual(
      rewriter.rewritePath("app/src/utils/helper.js"),
      "/workspace/src/utils/helper.js",
    );
  });

  it("should not rewrite paths that don't match", () => {
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

    const mapping = rewriter.getMapping();
    assert.strictEqual(mapping.from, "/app/src");
    assert.strictEqual(mapping.to, "/workspace/src");
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
});
