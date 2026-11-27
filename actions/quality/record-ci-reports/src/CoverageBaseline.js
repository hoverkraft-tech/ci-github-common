import fs from "node:fs";
import path from "node:path";
import { ArtifactDownload } from "../../../download-artifact/src/ArtifactDownload.js";
import { Protocol } from "./Protocol.js";

/** Compare only retained default-branch evidence for the exact PR base commit. */
export class CoverageBaseline {
	constructor({ github, context, artifacts, core, token, temporaryDirectory }) {
		Object.assign(this, {
			github,
			context,
			artifacts,
			core,
			token,
			temporaryDirectory,
		});
	}

	static comparable(current, previous, currentChecks, previousChecks) {
		const check = currentChecks.find((item) => item.id === current.checkId);
		const baseCheck = previousChecks.find(
			(item) => item.id === previous.checkId,
		);
		return (
			current.label === previous.label &&
			current.project === previous.project &&
			current.language === previous.language &&
			current.role === previous.role &&
			!previous.errors.length &&
			baseCheck?.result?.outcome === "success" &&
			!baseCheck.result.errors.length &&
			JSON.stringify(check?.check.variant) ===
				JSON.stringify(baseCheck.check.variant) &&
			current.assets[0]?.format === previous.assets[0]?.format
		);
	}

	async attach(collection) {
		const sha = this.context.payload.pull_request?.base.sha;
		for (const dataset of collection.datasets)
			dataset.baseline = {
				reason: sha
					? "No comparable report retained for the exact PR base commit."
					: "This event has no PR base commit.",
			};
		if (!sha || !collection.datasets.length) return;
		const directory = fs.mkdtempSync(
			path.join(this.temporaryDirectory, "ci-baseline-"),
		);
		try {
			const { data } = await this.github.rest.actions.listWorkflowRunsForRepo({
				...this.context.repo,
				branch: this.context.payload.repository.default_branch,
				head_sha: sha,
				event: "push",
				status: "success",
				per_page: 30,
			});
			for (const run of data.workflow_runs.slice(0, 10)) {
				if (
					run.head_sha !== sha ||
					run.conclusion !== "success" ||
					run.head_repository?.id !== this.context.payload.repository.id
				)
					continue;
				const artifacts = await this.github.paginate(
					this.github.rest.actions.listWorkflowRunArtifacts,
					{ ...this.context.repo, run_id: run.id, per_page: 100 },
				);
				const matches = artifacts.filter(
					(item) =>
						item.name === `${Protocol.prefix}collection-${run.run_attempt}` &&
						!item.expired,
				);
				if (
					matches.length !== 1 ||
					matches[0].size_in_bytes > Protocol.maxBundleBytes
				)
					continue;
				await new ArtifactDownload({
					client: this.artifacts,
					core: this.core,
				}).download({
					artifactIds: String(matches[0].id),
					destination: directory,
					mergeMultiple: true,
					skipDecompress: false,
					findBy: {
						token: this.token,
						repositoryOwner: this.context.repo.owner,
						repositoryName: this.context.repo.repo,
						workflowRunId: run.id,
					},
				});
				const baseline = Protocol.read(directory, "collection.json");
				if (
					baseline.version !== Protocol.version ||
					baseline.identity.sha !== sha ||
					baseline.identity.runId !== String(run.id) ||
					baseline.identity.repository !== collection.identity.repository ||
					baseline.errors.length
				)
					continue;
				for (const dataset of collection.datasets) {
					if (dataset.baseline.coverage || dataset.errors.length) continue;
					const candidates = baseline.datasets.filter(
						(item) =>
							item.source.sha === sha &&
							item.source.kind === "branch" &&
							CoverageBaseline.comparable(
								dataset,
								item,
								collection.checks,
								baseline.checks,
							),
					);
					if (candidates.length !== 1) continue;
					dataset.baseline = {
						sha,
						coverage: candidates[0].assets[0].data.coverage,
						url: run.html_url,
					};
				}
				// Never overlay separate artifact trees while looking for another measurement.
				for (const entry of fs.readdirSync(directory))
					fs.rmSync(path.join(directory, entry), {
						recursive: true,
						force: true,
					});
				if (
					collection.datasets.every(
						(item) => item.baseline.coverage || item.errors.length,
					)
				)
					break;
			}
		} catch (error) {
			for (const dataset of collection.datasets)
				if (!dataset.baseline.coverage)
					dataset.baseline = {
						reason: `Comparison unavailable: ${error.message}`,
					};
		} finally {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	}
}
