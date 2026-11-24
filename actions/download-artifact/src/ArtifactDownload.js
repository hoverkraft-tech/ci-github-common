import { homedir } from "node:os";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

export class ArtifactDownload {
	constructor({ client, core, sleep = setTimeout }) {
		this.client = client;
		this.core = core;
		this.sleep = sleep;
	}

	async download({
		artifactIds,
		destination,
		mergeMultiple,
		skipDecompress,
		findBy,
	}) {
		const ids = this.parseIds(artifactIds);
		const pending = new Set(ids);
		const downloadPath = path.resolve(
			destination.replace(/^~(?=\/|$)/, homedir()),
		);
		const options = findBy ? { findBy } : {};

		for (let attempt = 0; ; attempt += 1) {
			const { artifacts } = await this.client.listArtifacts({
				latest: true,
				...options,
			});
			for (const artifact of artifacts) {
				if (!pending.has(artifact.id)) continue;
				if (
					!artifact.name ||
					/[\\/]/.test(artifact.name) ||
					[".", ".."].includes(artifact.name)
				) {
					throw new Error(`Invalid artifact name for ID ${artifact.id}`);
				}
				let result;
				try {
					result = await this.client.downloadArtifact(artifact.id, {
						...options,
						path:
							mergeMultiple || ids.length === 1
								? downloadPath
								: path.join(downloadPath, artifact.name),
						expectedHash: artifact.digest,
						skipDecompress,
					});
				} catch (error) {
					// Metadata visibility can regress between listing and downloading.
					if (
						error.name === "ArtifactNotFoundError" ||
						(findBy && error.status === 404)
					)
						continue;
					throw error;
				}
				if (result.digestMismatch)
					throw new Error(
						`Digest validation failed for artifact ${artifact.id}`,
					);
				pending.delete(artifact.id);
			}
			if (pending.size === 0) {
				this.core.setOutput("download-path", downloadPath);
				return;
			}
			if (attempt === RETRY_DELAYS.length) {
				throw new Error(
					`Artifacts could not be downloaded: ${[...pending].join(", ")}`,
				);
			}
			const delay = RETRY_DELAYS[attempt];
			this.core.info(
				`Retrying artifacts ${[...pending].join(", ")} in ${delay / 1000}s`,
			);
			await this.sleep(delay);
		}
	}

	parseIds(value) {
		const ids = (value ?? "").split(",").map((id) => id.trim());
		if (
			ids.some(
				(id) => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)),
			)
		) {
			throw new Error(
				"artifact-ids must contain comma-separated positive safe integers",
			);
		}
		return [...new Set(ids.map(Number))];
	}
}
