import fs from "node:fs";
import path from "node:path";
import { ReportRenderer } from "../../parse-ci-reports/dist/index.js";
import { CheckRunner } from "./CheckRunner.js";
import { Collector } from "./Collector.js";
import { CoveragePublication } from "./CoveragePublication.js";
import { Diagnostics } from "./Diagnostics.js";
import { ExecutionIdentity } from "./ExecutionIdentity.js";
import { GitHubCoverage } from "./GitHubCoverage.js";
import { Protocol } from "./Protocol.js";
import { Recording } from "./Recording.js";
import { ReportArtifacts } from "./ReportArtifacts.js";
import { ReportComment } from "./ReportComment.js";
import { Reporters } from "./Reporters.js";

/** Entrypoints used by metadata; publication operations remain workflow-internal. */
export class Runtime {
	constructor({ core, github, context, actionPath, token, client }) {
		Object.assign(this, { core, github, context, actionPath });
		this.temporaryDirectory = process.env.RUNNER_TEMP;
		this.client = client;
		this.execution = new ExecutionIdentity({
			github,
			context,
			attempt: process.env.GITHUB_RUN_ATTEMPT,
			runnerName: process.env.RUNNER_NAME,
		});
		this.store = new ReportArtifacts({
			github,
			context,
			client: this.client,
			core,
			token,
			temporaryDirectory: this.temporaryDirectory,
		});
	}

	outputs(values) {
		for (const [key, value] of Object.entries(values))
			this.core.setOutput(key, value);
	}

	async producer(operation, input) {
		const recording = new Recording({
			execution: this.execution,
			artifacts: this.client,
			context: this.context,
			workspace: process.env.GITHUB_WORKSPACE,
			temporaryDirectory: this.temporaryDirectory,
		});
		let result;
		if (operation === "prepare") {
			if (
				!input.definition ||
				input.recording ||
				input.outcome ||
				input.exitCode
			)
				throw new Error("prepare requires only definition.");
			result = await recording.prepare(JSON.parse(input.definition));
		} else if (operation === "finalize") {
			if (!input.recording || !input.outcome || input.definition)
				throw new Error(
					"finalize requires recording and outcome, without definition.",
				);
			result = await recording.finalize({
				recording: input.recording,
				outcome: input.outcome,
				...(input.exitCode === "" ? {} : { exitCode: Number(input.exitCode) }),
			});
		} else if (operation === "run-check")
			result = await new CheckRunner({ recording }).run(input);
		else throw new Error("operation must be prepare or finalize.");
		this.outputs(result);
		if (
			result.complete === false ||
			(result.outcome && result.outcome !== "success")
		)
			this.core.setFailed(
				`Check ${result.outcome}. ${result.errors.join(" ")}`,
			);
	}

	render(collection, receipts, jobs, includeComment) {
		const errors = Reporters.complete(collection, receipts, jobs, {
			includeComment,
		});
		return {
			errors,
			renderer: new ReportRenderer({
				collection,
				receipts,
				errors,
				runUrl: `${this.context.serverUrl}/${collection.identity.repository}/actions/runs/${this.context.runId}/attempts/${collection.identity.attempt}`,
				sourceUrl: `${this.context.serverUrl}/${collection.identity.repository}/blob`,
			}),
		};
	}

	async collect(input) {
		const collector = new Collector({
			execution: this.execution,
			github: this.github,
			context: this.context,
			artifacts: this.client,
			core: this.core,
			temporaryDirectory: this.temporaryDirectory,
			token: input.token,
		});
		const { collection, directory } = await collector.collect({
			jobs: JSON.parse(input.jobs),
			reporters: JSON.parse(input.reporters),
		});
		try {
			const id = await this.store.upload(
				`${Protocol.prefix}collection-${collection.identity.attempt}`,
				directory,
			);
			const datasets = collection.datasets
				.filter((item) => item.role === "primary")
				.map((item) => ({ id: item.id, label: item.label }));
			this.outputs({
				"artifact-id": id,
				datasets,
				reporters: collection.reporters,
				annotations: ["test", "lint"].some(
					(kind) =>
						collection.reporters[kind].includes("annotations") &&
						collection.checks.some((check) =>
							check.check.reports.some((report) => report.kind === kind),
						),
				),
				"code-scanning":
					collection.reporters.lint.includes("code-scanning") &&
					collection.checks.some((check) =>
						check.check.reports.some((report) => report.kind === "lint"),
					),
			});
		} finally {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	}

	async saveReceipt(receipt) {
		await this.store.receipt(receipt);
		if (["failed", "superseded"].includes(receipt.status))
			this.core.setFailed(receipt.message);
	}

	async publisher(operation, input, collection, directory) {
		const dataset = collection.datasets.find(
			(item) => item.id === input.dataset,
		);
		const publication = new CoveragePublication({
			directory,
			actionPath: this.actionPath,
			temporaryDirectory: this.temporaryDirectory,
		});
		if (operation === "github") {
			if (!dataset) throw new Error("Unknown coverage dataset.");
			return this.saveReceipt(
				await new GitHubCoverage(this).publish({
					dataset,
					file: () => publication.prepare(dataset, "github").file,
					auto: collection.reporters.coverage.includes("auto"),
					explicit: collection.reporters.coverage.includes("github"),
				}),
			);
		}
		if (operation === "annotations" || operation === "code-scanning") {
			const diagnostics = new Diagnostics({ ...this, collection });
			if (operation === "code-scanning")
				return this.saveReceipt(await diagnostics.codeScanning());
			for (const kind of ["test", "lint"])
				if (
					collection.reporters[kind].includes("annotations") &&
					collection.checks.some((check) =>
						check.check.reports.some((report) => report.kind === kind),
					)
				)
					await this.saveReceipt(diagnostics.annotations(kind));
			return;
		}
		if (operation === "prepare-external") {
			if (!dataset || !["codecov", "coveralls"].includes(input.reporter))
				throw new Error("Unknown coverage destination.");
			if (
				input.reporter === "coveralls" &&
				new Set(
					collection.datasets
						.filter((item) => item.role === "primary")
						.map((item) => item.source.sha),
				).size !== 1
			)
				throw new Error("One Coveralls build requires one tested commit.");
			const pr = this.context.payload.pull_request;
			if (pr) {
				if (pr.head.repo.full_name !== collection.identity.repository)
					throw new Error(
						"Explicit external publication is unavailable to this fork run.",
					);
				const { data: current } = await this.github.rest.pulls.get({
					...this.context.repo,
					pull_number: pr.number,
				});
				if (current.state !== "open" || current.head.sha !== pr.head.sha)
					throw new Error(
						"Coverage publication was superseded by a newer PR head.",
					);
			}
			const { file, format } = publication.prepare(dataset, input.reporter);
			// Official uploader inputs are shell-sensitive. Generated paths and IDs
			// are the only values forwarded; never forward report labels as flags.
			if (!/^[a-zA-Z0-9_./-]+$/.test(file))
				throw new Error(
					"Uploader staging path contains unsupported characters.",
				);
			this.outputs({ file, format, sha: dataset.source.sha, directory });
			return;
		}
		if (operation === "external-receipt") {
			if (!dataset || !["codecov", "coveralls"].includes(input.reporter))
				throw new Error("Unknown external receipt.");
			return this.saveReceipt(
				Reporters.receipt({
					dataset,
					reporter: input.reporter,
					status: input.outcome === "success" ? "submitted" : "failed",
					message:
						input.outcome === "success"
							? "Pinned official uploader completed strict submission. Provider processing is not confirmed."
							: `Official uploader did not submit coverage (${input.outcome || "missing outcome"}).`,
				}),
			);
		}
		if (operation === "check-coveralls") {
			const receipts = await this.store.receipts();
			const expected = collection.datasets.filter(
				(item) => item.role === "primary",
			);
			if (new Set(expected.map((item) => item.source.sha)).size !== 1)
				throw new Error("One Coveralls build requires one tested commit.");
			for (const item of expected)
				if (
					receipts.filter(
						(receipt) =>
							receipt.reporter === "coveralls" &&
							receipt.dataset === item.id &&
							receipt.digest === item.digest &&
							receipt.source === item.source.sha &&
							receipt.status === "submitted",
					).length !== 1
				)
					throw new Error(
						"Coveralls completion requires every expected dataset submission.",
					);
			this.outputs({ sha: expected[0].source.sha });
			return;
		}
		if (operation === "finish-coveralls")
			return this.saveReceipt(
				Reporters.receipt({
					dataset: Reporters.subject(collection),
					reporter: "coveralls-finish",
					status: input.outcome === "success" ? "submitted" : "failed",
					message:
						input.outcome === "success"
							? "Complete build submitted without carryforward."
							: "Coveralls build completion failed or was skipped.",
				}),
			);
		throw new Error(`Unknown publication operation: ${operation}`);
	}

	async feedback(operation, input, collection) {
		const receipts = await this.store.receipts();
		const jobs = JSON.parse(input.publisherJobs || "{}");
		const { renderer, errors } = this.render(
			collection,
			receipts,
			jobs,
			operation === "complete",
		);
		if (operation === "comment") {
			const body = renderer.render({ comment: true });
			if (body)
				await this.saveReceipt(
					await new ReportComment({ ...this, collection }).publish(body, {
						fallbackOnly: !Object.values(collection.reporters).some((values) =>
							values.includes("comment"),
						),
					}),
				);
			return;
		}
		const markdown = renderer.render();
		await this.core.summary.addRaw(markdown).write();
		this.outputs({ markdown });
		if (errors.length) this.core.setFailed(errors.join(" "));
	}

	async failCompletion(message) {
		const runUrl = `${this.context.serverUrl}/${this.context.repo.owner}/${this.context.repo.repo}/actions/runs/${this.context.runId}/attempts/${process.env.GITHUB_RUN_ATTEMPT}`;
		await this.core.summary
			.addRaw(
				`## ❌ CI reports incomplete\n\n${ReportRenderer.text(message)}\n\nNo missing publication was inferred successful. [Open collection and producer jobs](${runUrl}).\n\nWorkflow revision: ${this.context.sha}.\n`,
			)
			.write();
		this.core.setFailed(message);
	}

	async internal(operation, input) {
		try {
			return await this.performInternal(operation, input);
		} catch (error) {
			if (operation !== "complete") throw error;
			return this.failCompletion(error.message);
		}
	}

	async performInternal(operation, input) {
		if (operation === "collect") return this.collect(input);
		if (!input.artifactId) {
			if (operation !== "complete")
				throw new Error("Validated collection artifact is missing.");
			return this.failCompletion(
				"Collection failed or producers were cancelled. Report completion was not established.",
			);
		}
		let cleanupDirectory;
		if (input.cleanupDirectory) {
			cleanupDirectory = fs.realpathSync(input.cleanupDirectory);
			if (
				path.dirname(cleanupDirectory) !==
					fs.realpathSync(this.temporaryDirectory) ||
				!path.basename(cleanupDirectory).startsWith("ci-publication-")
			)
				throw new Error("Invalid publication cleanup path.");
		}
		const { collection, directory } = await this.store.collection(
			input.artifactId,
		);
		let keep = false;
		try {
			if (["comment", "complete"].includes(operation))
				await this.feedback(operation, input, collection);
			else await this.publisher(operation, input, collection, directory);
			keep = operation === "prepare-external";
		} finally {
			if (!keep) fs.rmSync(directory, { recursive: true, force: true });
			fs.rmSync(path.join(this.temporaryDirectory, "ci-coverage-converter"), {
				recursive: true,
				force: true,
			});
			if (cleanupDirectory)
				fs.rmSync(cleanupDirectory, { recursive: true, force: true });
		}
	}
}
