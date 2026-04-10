import {
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { LocalActionsManager } from "./LocalActionsManager.js";

const createFixture = () => {
  const sandboxDirectory = mkdtempSync(
    path.join(os.tmpdir(), "local-actions-"),
  );
  const workspaceDirectory = path.join(sandboxDirectory, "workspace");
  const actionsDirectory = path.join(workspaceDirectory, "actions");
  const currentActionPath = path.join(
    actionsDirectory,
    "create-or-update-comment",
  );
  const siblingActionPath = path.join(actionsDirectory, "get-issue-number");

  mkdirSync(workspaceDirectory, { recursive: true });
  mkdirSync(currentActionPath, { recursive: true });
  mkdirSync(siblingActionPath, { recursive: true });
  writeFileSync(
    path.join(currentActionPath, "action.yml"),
    "name: current\n",
    "utf8",
  );
  writeFileSync(
    path.join(siblingActionPath, "action.yml"),
    "name: sibling\n",
    "utf8",
  );

  return {
    actionsDirectory,
    currentActionPath,
    sandboxDirectory,
    selfActionsPath: path.join(sandboxDirectory, "self-actions"),
    workspaceDirectory,
    teardown() {
      rmSync(sandboxDirectory, { force: true, recursive: true });
    },
  };
};

test("prepare creates a symlink to sibling actions in the destination", async () => {
  const fixture = createFixture();
  const manager = new LocalActionsManager();

  try {
    const result = await manager.prepare({
      sourcePath: fixture.actionsDirectory,
      workspacePath: fixture.workspaceDirectory,
    });

    assert.equal(result.created, true);
    assert.equal(result.destinationPath, fixture.selfActionsPath);
    assert.equal(lstatSync(fixture.selfActionsPath).isSymbolicLink(), true);
    assert.equal(
      realpathSync(fixture.selfActionsPath),
      fixture.actionsDirectory,
    );
    assert.equal(
      readFileSync(
        path.join(fixture.selfActionsPath, "get-issue-number", "action.yml"),
        "utf8",
      ),
      "name: sibling\n",
    );
    assert.equal(
      readFileSync(
        path.join(
          fixture.selfActionsPath,
          "create-or-update-comment",
          "action.yml",
        ),
        "utf8",
      ),
      "name: current\n",
    );
    assert.equal(
      existsSync(path.join(fixture.selfActionsPath, "self-actions")),
      false,
    );
  } finally {
    fixture.teardown();
  }
});

test("prepare reuses an existing destination without marking it for cleanup", async () => {
  const fixture = createFixture();
  const manager = new LocalActionsManager();

  try {
    mkdirSync(fixture.selfActionsPath, { recursive: true });
    writeFileSync(
      path.join(fixture.selfActionsPath, "marker.txt"),
      "existing\n",
      "utf8",
    );

    const result = await manager.prepare({
      sourcePath: fixture.actionsDirectory,
      workspacePath: fixture.workspaceDirectory,
    });

    assert.equal(result.created, false);
    assert.equal(
      readFileSync(path.join(fixture.selfActionsPath, "marker.txt"), "utf8"),
      "existing\n",
    );
  } finally {
    fixture.teardown();
  }
});

test("cleanup removes the destination only when it was created by the action", async () => {
  const fixture = createFixture();
  const manager = new LocalActionsManager();

  try {
    await manager.prepare({
      sourcePath: fixture.actionsDirectory,
      workspacePath: fixture.workspaceDirectory,
    });

    assert.equal(
      await manager.cleanup({
        created: true,
        destinationPath: fixture.selfActionsPath,
      }),
      true,
    );
    assert.equal(
      await manager.cleanup({
        created: false,
        destinationPath: fixture.selfActionsPath,
      }),
      false,
    );
  } finally {
    fixture.teardown();
  }
});

test("resolveDestinationPath resolves to workspace parent self-actions", () => {
  const manager = new LocalActionsManager();

  assert.equal(
    manager.resolveDestinationPath({
      workspacePath: "/tmp/workspace",
    }),
    path.resolve("/tmp/workspace", "../self-actions"),
  );
});
