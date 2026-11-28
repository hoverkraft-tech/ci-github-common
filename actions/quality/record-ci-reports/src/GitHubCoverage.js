import fs from "node:fs";
import { gzipSync } from "node:zlib";
import { Reporters } from "./Reporters.js";

/** Temporary outcome adapter for the official uploader's existing API contract. */
export class GitHubCoverage {
	constructor({
		github,
		context,
		sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
		now = Date.now,
	}) {
		Object.assign(this, { github, context, sleep, now });
	}

	async capability() {
		try {
			const response = await this.github.request(
				"GET /repos/{owner}/{repo}/code-quality/findings",
				{ ...this.context.repo, per_page: 1, request: { timeout: 20000 } },
			);
			if (!Array.isArray(response.data))
				throw new Error("Malformed Code Quality capability response.");
			return { available: true };
		} catch (error) {
			if (
				error.status === 403 &&
				error.response?.data?.message ===
					"Code quality is not enabled for this repository. Please enable code quality in the repository settings."
			)
				return {
					available: false,
					reason: "GitHub Code Quality is disabled for this repository.",
				};
			throw error;
		}
	}

	async target(dataset) {
		const pr = this.context.payload.pull_request;
		if (this.context.eventName === "merge_group")
			return {
				unavailable: "Native coverage is not available for merge-group events.",
			};
		if (pr) {
			if (
				pr.head.repo.full_name !==
				`${this.context.repo.owner}/${this.context.repo.repo}`
			)
				return {
					unavailable:
						"Native coverage is not available to this fork workflow.",
				};
			if (
				dataset.source.kind !== "pr-head" ||
				dataset.source.sha !== pr.head.sha
			)
				return {
					unavailable:
						"Coverage measured the PR merge result, not its head commit.",
				};
			const { data: current } = await this.github.rest.pulls.get({
				...this.context.repo,
				pull_number: pr.number,
			});
			if (current.state !== "open" || current.head.sha !== dataset.source.sha)
				return {
					superseded: "The PR changed after this coverage was measured.",
				};
			return { pull_request_number: pr.number };
		}
		const branch = this.context.payload.repository.default_branch;
		if (this.context.ref !== `refs/heads/${branch}`)
			return {
				unavailable:
					"This run is neither a pull request nor a default-branch measurement.",
			};
		if (dataset.source.sha !== this.context.sha)
			throw new Error("Coverage source differs from the workflow commit.");
		return { ref: this.context.ref };
	}

	async publish({ dataset, file, auto, explicit }) {
		const receipt = (status, message, extra = {}) => ({
			...Reporters.receipt({
				dataset,
				reporter: "github",
				status,
				message,
				...extra,
			}),
			...extra,
		});
		try {
			if (dataset.errors.length)
				return receipt("failed", dataset.errors.join(" "));
			const target = await this.target(dataset);
			if (target.superseded) return receipt("superseded", target.superseded);
			const capability = target.unavailable
				? { available: false, reason: target.unavailable }
				: await this.capability();
			if (!capability.available)
				return receipt(explicit ? "failed" : "unavailable", capability.reason, {
					...(auto
						? {
								fallback: this.context.payload.pull_request
									? "comment"
									: "summary",
							}
						: {}),
				});
			// FIXME: Replace with a pinned released action once outcome, report-id and
			// skip-reason are available and processing success can be required.
			// https://github.com/actions/upload-code-coverage/issues/36
			// https://github.com/actions/upload-code-coverage/pull/37
			const reportFile = typeof file === "function" ? await file() : file;
			const response = await this.github.request(
				"PUT /repos/{owner}/{repo}/code-coverage/report",
				{
					...this.context.repo,
					...target,
					commit_oid: dataset.source.sha,
					language_name: dataset.language,
					label: dataset.label,
					coverage_report: gzipSync(fs.readFileSync(reportFile)).toString(
						"base64",
					),
					request: { timeout: 20000 },
				},
			);
			const id = response.data?.id;
			if (typeof id !== "string" || !id)
				return receipt(
					"failed",
					`GitHub did not accept this coverage report: ${response.data?.message || "missing report ID"}`,
				);
			const deadline = this.now() + 160000;
			while (this.now() < deadline) {
				await this.sleep(Math.min(5000, deadline - this.now()));
				const { data } = await this.github.request(
					"GET /repos/{owner}/{repo}/code-coverage/reports/{report_id}",
					{ ...this.context.repo, report_id: id, request: { timeout: 20000 } },
				);
				if (data.processing_status === "succeeded")
					return receipt(
						"published",
						"GitHub confirmed successful processing.",
						{ id },
					);
				if (data.processing_status === "failed")
					return receipt(
						"failed",
						`GitHub processing failed: ${(data.errors || []).join("; ")}`,
						{ id },
					);
				if (!["pending", "processing"].includes(data.processing_status))
					return receipt("failed", "Malformed coverage processing response.", {
						id,
					});
			}
			return receipt(
				"failed",
				"Timed out waiting for GitHub coverage processing.",
				{ id },
			);
		} catch (error) {
			return receipt(
				"failed",
				`GitHub coverage publication failed: ${error.message}`,
			);
		}
	}
}
