import { gzipSync } from "node:zlib";
import { ReportRenderer } from "../../parse-ci-reports/dist/index.js";
import { Reporters } from "./Reporters.js";

/** Deduplicate diagnostics and preserve the publisher selected by their producer. */
export class Diagnostics {
	constructor({
		collection,
		core,
		github,
		context,
		sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
	}) {
		Object.assign(this, { collection, core, github, context, sleep });
		this.findings = new ReportRenderer({ collection }).findings();
	}

	annotations(kind) {
		const dataset = Reporters.subject(this.collection, kind);
		const findings =
			kind === "lint"
				? this.findings.lint.filter((item) => item.owner !== "tool")
				: this.findings.tests.filter(
						(item) =>
							["failed", "error"].includes(item.status) &&
							item.owner !== "tool",
					);
		const seen = new Set();
		let emitted = 0;
		for (const item of findings) {
			const key = JSON.stringify([
				item.check.source.sha,
				item.check.check.project,
				item.source,
				item.rule,
				item.name,
				item.file,
				item.line,
				item.message,
			]);
			if (seen.has(key)) continue;
			seen.add(key);
			if (emitted >= 50) continue;
			const properties = {
				title: String(item.rule || item.name || item.check.check.name).slice(
					0,
					250,
				),
			};
			if (item.file && item.check.source.sha === this.context.sha) {
				properties.file = item.file;
				if (Number.isSafeInteger(item.line) && item.line > 0)
					properties.startLine = item.line;
				if (
					Number.isSafeInteger(item.column) &&
					item.column > 0 &&
					properties.startLine
				)
					properties.startColumn = item.column;
			}
			const message = String(
				item.message || "See the native report for details.",
			).slice(0, 4000);
			if (item.severity === "warning") this.core.warning(message, properties);
			else if (item.severity === "info") this.core.notice(message, properties);
			else this.core.error(message, properties);
			emitted++;
		}
		return Reporters.receipt({
			dataset,
			reporter: "annotations",
			status: "published",
			message: `${emitted} annotations emitted; ${seen.size - emitted} additional diagnostics retained in the summary and artifacts. Tool-owned annotations were not repeated.`,
		});
	}

	async codeScanning() {
		const dataset = Reporters.subject(this.collection, "lint");
		const receipt = (status, message) =>
			Reporters.receipt({
				dataset,
				reporter: "code-scanning",
				status,
				message,
			});
		try {
			const owned = this.collection.checks.filter((check) =>
				check.check.reports.some(
					(report) => report.kind === "lint" && report.owner !== "tool",
				),
			);
			const findings = this.findings.lint.filter(
				(item) => item.owner !== "tool",
			);
			if (findings.length > 5000)
				throw new Error(
					"Code scanning publication exceeds 5000 findings. Full native reports are retained.",
				);
			for (const sha of new Set(owned.map((check) => check.source.sha))) {
				const checks = owned.filter((check) => check.source.sha === sha);
				const items = findings.filter((item) => item.check.source.sha === sha);
				if (items.some((item) => !item.file))
					throw new Error(
						"Code scanning requires a verified repository path for every finding.",
					);
				const sarif = {
					version: "2.1.0",
					runs: [
						{
							tool: { driver: { name: "Hoverkraft CI lint" } },
							automationDetails: {
								id: `${this.collection.identity.workflow}/lint/`,
							},
							results: items.map((item) => ({
								ruleId: String(item.rule || item.source || "lint"),
								level:
									item.severity === "error"
										? "error"
										: item.severity === "warning"
											? "warning"
											: "note",
								message: { text: String(item.message) },
								locations: [
									{
										physicalLocation: {
											artifactLocation: {
												uri: item.file
													.split("/")
													.map(encodeURIComponent)
													.join("/"),
												uriBaseId: "%SRCROOT%",
											},
											...(Number.isSafeInteger(item.line) && item.line > 0
												? { region: { startLine: item.line } }
												: {}),
										},
									},
								],
							})),
						},
					],
				};
				const ref =
					checks[0].source.kind === "pr-head"
						? `refs/pull/${this.context.payload.pull_request.number}/head`
						: this.context.ref;
				const { data } = await this.github.rest.codeScanning.uploadSarif({
					...this.context.repo,
					commit_sha: sha,
					ref,
					sarif: gzipSync(JSON.stringify(sarif)).toString("base64"),
					request: { timeout: 20000 },
				});
				if (!data.id)
					throw new Error("GitHub did not acknowledge SARIF submission.");
				let complete = false;
				for (let attempt = 0; attempt < 24; attempt++) {
					await this.sleep(5000);
					const response = await this.github.rest.codeScanning.getSarif({
						...this.context.repo,
						sarif_id: data.id,
						request: { timeout: 20000 },
					});
					if (response.data.processing_status === "complete") {
						complete = true;
						break;
					}
					if (response.data.processing_status !== "pending")
						throw new Error("GitHub rejected SARIF processing.");
				}
				if (!complete)
					throw new Error("Timed out waiting for SARIF processing.");
			}
			return receipt(
				"published",
				owned.length
					? "GitHub confirmed code scanning processing."
					: "All lint diagnostics are published by their owning tools; no duplicate upload.",
			);
		} catch (error) {
			return receipt("failed", error.message);
		}
	}
}
