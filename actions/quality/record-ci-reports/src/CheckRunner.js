import { spawn } from "node:child_process";
import path from "node:path";

/** Custom commands own their resources; this wrapper owns only report storage. */
export class CheckRunner {
	constructor({ recording, execute = CheckRunner.execute }) {
		Object.assign(this, { recording, execute });
	}

	static execute(command, options) {
		return new Promise((resolve, reject) => {
			const child = spawn(
				"bash",
				["--noprofile", "--norc", "-eo", "pipefail", "-c", command],
				{ ...options, stdio: "inherit" },
			);
			child.once("error", reject);
			child.once("exit", (code, signal) => resolve({ code, signal }));
		});
	}

	async run({
		command,
		name,
		project,
		testResults = "",
		testCoverage = "",
		lintResults = "",
	}) {
		if (typeof command !== "string" || !command.trim())
			throw new Error("command is required.");
		const reports = [];
		for (const [kind, patterns] of [
			["test", testResults],
			["coverage", testCoverage],
			["lint", lintResults],
		]) {
			for (const pattern of patterns
				.split(/\r?\n/)
				.map((value) => value.trim())
				.filter(Boolean))
				reports.push({ kind, pattern });
		}
		const prepared = await this.recording.prepare({
			name: name || "Custom check",
			project: project || ".",
			reports,
		});
		let execution;
		try {
			execution = await this.execute(command, {
				cwd: path.join(this.recording.workspace, project || "."),
				env: { ...process.env, CI_REPORTS_DIR: prepared["report-directory"] },
			});
		} catch (error) {
			const result = await this.recording.finalize({
				recording: prepared.recording,
				outcome: "failure",
			});
			return {
				...result,
				errors: [error.message, ...result.errors],
				complete: false,
			};
		}
		return this.recording.finalize({
			recording: prepared.recording,
			outcome: execution.signal
				? "cancelled"
				: execution.code === 0
					? "success"
					: "failure",
			...(execution.code === null ? {} : { exitCode: execution.code }),
		});
	}
}
