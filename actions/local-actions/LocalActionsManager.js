import { access, mkdir, rm, stat, symlink } from "node:fs/promises";
import process from "node:process";
import path from "node:path";

export class LocalActionsManager {
  async prepare({ sourcePath, workspacePath }) {
    const sourceDirectory = await this.resolveSourceDirectory({ sourcePath });
    const destinationPath = this.resolveDestinationPath({ workspacePath });

    if (await this.#exists(destinationPath)) {
      return {
        created: false,
        destinationPath,
      };
    }

    await mkdir(path.dirname(destinationPath), { recursive: true });
    const symlinkTarget = this.#resolveSymlinkTarget(
      sourceDirectory,
      destinationPath,
    );
    await symlink(symlinkTarget, destinationPath, this.#getSymlinkType());

    return {
      created: true,
      destinationPath,
    };
  }

  async cleanup({ created, destinationPath }) {
    if (!created || !destinationPath) {
      return false;
    }

    await rm(destinationPath, { force: true, recursive: true });

    return true;
  }

  resolveDestinationPath({ workspacePath }) {
    if (!workspacePath?.trim()) {
      throw new Error("Workspace path is required.");
    }

    return path.resolve(workspacePath, "../self-actions");
  }

  async resolveSourceDirectory({ sourcePath }) {
    return this.#resolveActionPath(sourcePath);
  }

  async #resolveActionPath(sourcePath) {
    if (!sourcePath?.trim()) {
      throw new Error("Input source-path is required.");
    }

    const actionPath = path.resolve(sourcePath);
    if (!(await this.#exists(actionPath))) {
      throw new Error(`Action path does not exist: ${actionPath}`);
    }

    if (!(await stat(actionPath)).isDirectory()) {
      throw new Error(`Action path must be a directory: ${actionPath}`);
    }

    return actionPath;
  }

  async #exists(targetPath) {
    try {
      await access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  #getSymlinkType() {
    return process.platform === "win32" ? "junction" : "dir";
  }

  /**
   * Computes the symlink target. Uses a relative path on non-Windows
   * platforms so the symlink resolves correctly from both the container
   * filesystem and the host filesystem (bind-mount path differs).
   * Windows junctions require absolute targets.
   */
  #resolveSymlinkTarget(sourceDirectory, destinationPath) {
    if (this.#getSymlinkType() === "junction") {
      return sourceDirectory;
    }

    return path.relative(path.dirname(destinationPath), sourceDirectory);
  }
}
