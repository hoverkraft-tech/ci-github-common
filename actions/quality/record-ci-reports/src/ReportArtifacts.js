import fs from "node:fs";
import path from "node:path";
import { ArtifactDownload } from "../../../download-artifact/src/ArtifactDownload.js";
import { Protocol } from "./Protocol.js";

/** Typed, immutable artifacts scoped to this run and collection attempt. */
export class ReportArtifacts {
	constructor({ github, context, client, core, token, temporaryDirectory }) {
		Object.assign(this, {
			github,
			context,
			client,
			core,
			token,
			temporaryDirectory,
		});
		this.attempt = Number(process.env.GITHUB_RUN_ATTEMPT);
	}

	async upload(name, directory) {
		const files = [...fs.globSync("**/*", { cwd: directory })]
			.filter((file) => fs.lstatSync(path.join(directory, file)).isFile())
			.map((file) => Protocol.file(directory, file));
		const result = await this.client.uploadArtifact(name, files, directory, {
			retentionDays: 7,
		});
		if (!result.id)
			throw new Error("Report artifact upload returned no artifact ID.");
		return result.id;
	}

	async download(ids, destination, mergeMultiple = true) {
		if (!/^\d+(,\d+)*$/.test(String(ids)))
			throw new Error("Invalid report artifact IDs.");
		await new ArtifactDownload({
			client: this.client,
			core: this.core,
		}).download({
			artifactIds: String(ids),
			destination,
			mergeMultiple,
			skipDecompress: false,
			findBy: {
				token: this.token,
				repositoryOwner: this.context.repo.owner,
				repositoryName: this.context.repo.repo,
				workflowRunId: this.context.runId,
			},
		});
	}

	async collection(id) {
		const directory = fs.mkdtempSync(
			path.join(this.temporaryDirectory, "ci-publication-"),
		);
		try {
			await this.download(id, directory);
			const collection = Protocol.read(directory, "collection.json");
			if (
				collection.version !== Protocol.version ||
				collection.identity.repository !==
					`${this.context.repo.owner}/${this.context.repo.repo}` ||
				collection.identity.runId !== String(this.context.runId) ||
				collection.identity.attempt !== this.attempt ||
				collection.identity.sha !== this.context.sha
			)
				throw new Error("Collection does not belong to this run attempt.");
			return { directory, collection };
		} catch (error) {
			fs.rmSync(directory, { recursive: true, force: true });
			throw error;
		}
	}

	async receipt(receipt) {
		if (
			!/^[a-z-]+$/.test(receipt.reporter) ||
			!/^[a-z0-9-]+$/.test(receipt.dataset)
		)
			throw new Error("Invalid receipt identity.");
		const directory = fs.mkdtempSync(
			path.join(this.temporaryDirectory, "ci-receipt-"),
		);
		try {
			Protocol.write(directory, "receipt.json", {
				...receipt,
				runId: String(this.context.runId),
				attempt: this.attempt,
			});
			return await this.upload(
				`${Protocol.prefix}receipt-${this.attempt}-${receipt.reporter}-${receipt.dataset}`,
				directory,
			);
		} finally {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	}

	async receipts() {
		const artifacts = await this.github.paginate(
			this.github.rest.actions.listWorkflowRunArtifacts,
			{ ...this.context.repo, run_id: this.context.runId, per_page: 100 },
		);
		const prefix = `${Protocol.prefix}receipt-${this.attempt}-`;
		const selected = artifacts.filter((artifact) =>
			artifact.name.startsWith(prefix),
		);
		if (
			selected.some((artifact) => artifact.expired) ||
			selected.length > 512 ||
			selected.reduce((sum, artifact) => sum + artifact.size_in_bytes, 0) >
				8 * 1024 * 1024 ||
			new Set(selected.map((artifact) => artifact.name)).size !==
				selected.length
		)
			throw new Error("Missing, duplicate or oversized publication receipts.");
		if (!selected.length) return [];
		const directory = fs.mkdtempSync(
			path.join(this.temporaryDirectory, "ci-receipts-"),
		);
		try {
			await this.download(
				selected.map((artifact) => artifact.id).join(","),
				directory,
				false,
			);
			return selected.map((artifact) => {
				const receipt = Protocol.read(
					selected.length === 1
						? directory
						: path.join(directory, artifact.name),
					"receipt.json",
				);
				if (
					artifact.name !== `${prefix}${receipt.reporter}-${receipt.dataset}` ||
					receipt.runId !== String(this.context.runId) ||
					receipt.attempt !== this.attempt ||
					![
						"published",
						"submitted",
						"unavailable",
						"superseded",
						"failed",
					].includes(receipt.status)
				)
					throw new Error("Invalid publication receipt provenance.");
				return receipt;
			});
		} finally {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	}
}
