import { appendFile } from "node:fs/promises";
import process from "node:process";
import { randomUUID } from "node:crypto";

export class ActionRuntime {
  getInput(name, { required = false } = {}) {
    const value =
      process.env[`INPUT_${name.replaceAll(" ", "_").toUpperCase()}`] ?? "";

    if (required && value.trim() === "") {
      throw new Error(`Input required and not supplied: ${name}`);
    }

    return value;
  }

  async setOutput(name, value) {
    await this.#writeCommandFile(process.env.GITHUB_OUTPUT, name, value);
  }

  async saveState(name, value) {
    await this.#writeCommandFile(process.env.GITHUB_STATE, name, value);
  }

  getState(name) {
    return process.env[`STATE_${name}`] ?? "";
  }

  getWorkspace() {
    const workspacePath = process.env.GITHUB_WORKSPACE ?? "";

    if (workspacePath.trim() === "") {
      throw new Error("GITHUB_WORKSPACE is required.");
    }

    return workspacePath;
  }

  info(message) {
    console.log(message);
  }

  setFailed(error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`::error::${message}`);
    process.exitCode = 1;
  }

  async #writeCommandFile(filePath, name, value) {
    if (!filePath) {
      throw new Error(`Missing command file for ${name}.`);
    }

    const stringValue = String(value);
    const delimiter = `ghadelimiter_${randomUUID()}`;
    await appendFile(
      filePath,
      `${name}<<${delimiter}\n${stringValue}\n${delimiter}\n`,
      "utf8",
    );
  }
}
