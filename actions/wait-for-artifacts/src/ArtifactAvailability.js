import { setTimeout } from "node:timers/promises";

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

export class ArtifactAvailability {
	constructor({ client, core, sleep = setTimeout }) {
		this.client = client;
		this.core = core;
		this.sleep = sleep;
	}

	async waitFor(artifactIds) {
		const ids = this.parseIds(artifactIds);
		for (let attempt = 0; ; attempt += 1) {
			const { artifacts } = await this.client.listArtifacts({ latest: true });
			const available = new Set(artifacts.map(({ id }) => id));
			const missing = ids.filter((id) => !available.has(id));
			if (missing.length === 0) {
				this.core.info(`Artifacts are available: ${ids.join(", ")}`);
				return;
			}
			if (attempt === RETRY_DELAYS.length) {
				throw new Error(
					`Artifacts did not become available: ${missing.join(", ")}`,
				);
			}
			const delay = RETRY_DELAYS[attempt];
			this.core.info(
				`Waiting ${delay / 1000}s for artifacts: ${missing.join(", ")}`,
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
