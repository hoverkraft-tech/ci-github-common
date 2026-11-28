import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NativeReports } from "./NativeReports.js";
import { Protocol } from "./Protocol.js";

/** Register before execution, then retain validated results independently of outcome. */
export class Recording {
	constructor({
		execution,
		artifacts,
		workspace,
		temporaryDirectory,
		context,
	}) {
		Object.assign(this, { execution, artifacts, context });
		this.workspace = fs.realpathSync(workspace);
		this.temporaryDirectory = fs.realpathSync(temporaryDirectory);
		this.native = new NativeReports();
	}

	source(definition) {
		// Container jobs can mount the trusted Actions checkout with a different UID.
		// Scope trust to this read of the verified workspace, never global Git config.
		const sha = execFileSync(
			"git",
			[
				"-c",
				`safe.directory=${this.workspace}`,
				"-C",
				this.workspace,
				"rev-parse",
				"HEAD",
			],
			{ encoding: "utf8" },
		).trim();
		if (definition.source && definition.source.sha !== sha)
			throw new Error(
				"Declared tested source differs from the actual checkout.",
			);
		if (!/^[a-f0-9]{40}$/.test(sha))
			throw new Error("Invalid checkout revision.");
		const pr = this.context.payload.pull_request;
		const kind = pr
			? sha === pr.head.sha
				? "pr-head"
				: sha === this.context.sha
					? "pr-merge"
					: "other"
			: sha === this.context.sha
				? "branch"
				: "other";
		if (kind === "other")
			throw new Error("Checkout source is unrelated to this workflow event.");
		return {
			sha,
			kind,
			...(pr
				? { pr: { number: pr.number, head: pr.head.sha, base: pr.base.sha } }
				: {}),
		};
	}

	async upload(name, directory, files) {
		const result = await this.artifacts.uploadArtifact(
			name,
			[...new Set(files)].map((file) => Protocol.file(directory, file)),
			directory,
			{ retentionDays: 7 },
		);
		if (!result.id)
			throw new Error("GitHub did not acknowledge the report artifact upload.");
		return result.id;
	}

	async prepare(definition) {
		const check = Protocol.definition(definition);
		const project = fs.realpathSync(path.join(this.workspace, check.project));
		const relative =
			path.relative(this.workspace, project).split(path.sep).join("/") || ".";
		if (
			!fs.statSync(project).isDirectory() ||
			Protocol.relative(relative, { root: true }) !== check.project
		)
			throw new Error(
				"Project directory must be inside the checkout without symlink aliases.",
			);
		const registration = {
			version: Protocol.version,
			id: randomUUID(),
			check,
			execution: await this.execution.current(),
			source: this.source(check),
			createdAt: new Date().toISOString(),
		};
		const directory = fs.mkdtempSync(
			path.join(this.temporaryDirectory, "ci-recording-"),
		);
		try {
			fs.mkdirSync(path.join(directory, "reports"), { mode: 0o700 });
			Protocol.write(directory, "registration.json", registration);
			const artifactId = await this.upload(
				`${Protocol.prefix}registration-${registration.id}`,
				directory,
				["registration.json"],
			);
			Protocol.write(directory, "handle.json", {
				version: Protocol.version,
				registrationDigest: Protocol.digest(
					fs.readFileSync(path.join(directory, "registration.json")),
				),
				artifactId,
			});
			return {
				recording: directory,
				"report-directory": path.join(directory, "reports"),
				"registration-id": registration.id,
			};
		} catch (error) {
			fs.rmSync(directory, { recursive: true, force: true });
			throw error;
		}
	}

	async finalize({ recording, outcome, exitCode }) {
		if (!["success", "failure", "cancelled"].includes(outcome))
			throw new Error(
				"Finalize requires success, failure or cancelled outcome.",
			);
		if (
			exitCode !== undefined &&
			(!Number.isSafeInteger(exitCode) ||
				exitCode < 0 ||
				exitCode > 255 ||
				(outcome === "success" && exitCode !== 0))
		)
			throw new Error("Invalid or contradictory command exit code.");
		const directory = fs.realpathSync(recording);
		if (
			path.dirname(directory) !== this.temporaryDirectory ||
			!path.basename(directory).startsWith("ci-recording-")
		)
			throw new Error(
				"Recording handle is outside this runner's private storage.",
			);
		const handle = Protocol.read(directory, "handle.json");
		const registration = Protocol.read(directory, "registration.json");
		if (
			handle.registrationDigest !==
			Protocol.digest(
				fs.readFileSync(Protocol.file(directory, "registration.json")),
			)
		)
			throw new Error("Recording registration changed after preparation.");
		const execution = await this.execution.current();
		if (JSON.stringify(execution) !== JSON.stringify(registration.execution))
			throw new Error("Recording must finish in its original job execution.");
		if (
			JSON.stringify(this.source(registration.check)) !==
			JSON.stringify(registration.source)
		)
			throw new Error("Tested checkout changed during the check.");
		const { assets, errors } = this.native.validate(
			path.join(directory, "reports"),
			registration.check,
			this.workspace,
		);
		if (
			assets.some(
				(asset) =>
					asset.data?.tests?.some((item) =>
						["failed", "error"].includes(item.status),
					) ||
					asset.data?.lintIssues?.some((item) => item.severity === "error"),
			)
		)
			errors.push("Native reports contain failing tests or lint errors.");
		const result = {
			version: Protocol.version,
			id: registration.id,
			registrationDigest: handle.registrationDigest,
			execution,
			source: registration.source,
			outcome,
			...(exitCode === undefined ? {} : { exitCode }),
			assets: assets.map((asset) => ({
				...asset,
				file: `reports/${asset.file}`,
			})),
			errors,
		};
		Protocol.write(directory, "result.json", result);
		try {
			const artifactId = await this.upload(
				`${Protocol.prefix}result-${registration.id}`,
				directory,
				["result.json", ...result.assets.map((asset) => asset.file)],
			);
			return {
				"artifact-id": artifactId,
				complete: errors.length === 0,
				errors,
				outcome,
			};
		} finally {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	}
}
