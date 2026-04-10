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
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const packageDirectory = path.dirname(new URL(import.meta.url).pathname);

const createFixture = () => {
  const sandboxDirectory = mkdtempSync(
    path.join(os.tmpdir(), "local-actions-script-"),
  );
  const workspaceDirectory = path.join(sandboxDirectory, "workspace");
  const actionsDirectory = path.join(workspaceDirectory, "actions");
  const currentActionPath = path.join(
    actionsDirectory,
    "create-or-update-comment",
  );
  const siblingActionPath = path.join(actionsDirectory, "get-issue-number");
  const outputFile = path.join(sandboxDirectory, "github-output.txt");
  const stateFile = path.join(sandboxDirectory, "github-state.txt");

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
  writeFileSync(outputFile, "", "utf8");
  writeFileSync(stateFile, "", "utf8");

  return {
    actionsDirectory,
    currentActionPath,
    outputFile,
    sandboxDirectory,
    selfActionsPath: path.join(sandboxDirectory, "self-actions"),
    stateFile,
    workspaceDirectory,
    teardown() {
      rmSync(sandboxDirectory, { force: true, recursive: true });
    },
  };
};

const runNodeScript = (scriptPath, env) =>
  spawnSync(process.execPath, [scriptPath], {
    cwd: packageDirectory,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
    },
  });

test("index.js writes outputs and creates the local actions symlink", () => {
  const fixture = createFixture();

  try {
    const result = runNodeScript(path.join(packageDirectory, "index.js"), {
      GITHUB_WORKSPACE: fixture.workspaceDirectory,
      GITHUB_OUTPUT: fixture.outputFile,
      GITHUB_STATE: fixture.stateFile,
      "INPUT_SOURCE-PATH": fixture.actionsDirectory,
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(
      result.stdout,
      new RegExp(
        `Resolved local actions source: ${fixture.actionsDirectory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`,
      ),
    );
    assert.match(
      result.stdout,
      new RegExp(
        `Resolved local actions destination: ${fixture.selfActionsPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`,
      ),
    );
    assert.equal(lstatSync(fixture.selfActionsPath).isSymbolicLink(), true);
    assert.equal(
      realpathSync(fixture.selfActionsPath),
      fixture.actionsDirectory,
    );
    assert.equal(
      existsSync(
        path.join(fixture.selfActionsPath, "get-issue-number", "action.yml"),
      ),
      true,
    );
    assert.match(
      readFileSync(fixture.outputFile, "utf8"),
      /^path<<.+\n.*self-actions\n.+\n$/s,
    );
    assert.match(
      readFileSync(fixture.stateFile, "utf8"),
      /^local_actions_created<<.+\ntrue\n.+\n/s,
    );
    assert.match(
      readFileSync(fixture.stateFile, "utf8"),
      /^local_actions_created<<.+\ntrue\n.+\nlocal_actions_destination_path<<.+\n.*self-actions\n.+\n$/s,
    );
  } finally {
    fixture.teardown();
  }
});

test("cleanup.js removes the created destination from saved state", () => {
  const fixture = createFixture();

  try {
    mkdirSync(fixture.selfActionsPath, { recursive: true });
    writeFileSync(
      path.join(fixture.selfActionsPath, "marker.txt"),
      "cleanup\n",
      "utf8",
    );

    const result = runNodeScript(path.join(packageDirectory, "cleanup.js"), {
      STATE_local_actions_created: "true",
      STATE_local_actions_destination_path: fixture.selfActionsPath,
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(fixture.selfActionsPath), false);
  } finally {
    fixture.teardown();
  }
});
