import fs from "node:fs";
import path from "node:path";
import { ArtifactDownload } from "../../../download-artifact/src/ArtifactDownload.js";
import { CoverageBaseline } from "./CoverageBaseline.js";
import { NativeReports } from "./NativeReports.js";
import { Protocol } from "./Protocol.js";
import { Reporters } from "./Reporters.js";

/** One collector consumes registrations from the whole originating workflow run. */
export class Collector {
	constructor({
		execution,
		github,
		context,
		artifacts,
		core,
		temporaryDirectory,
		token,
	}) {
		Object.assign(this, {
			execution,
			github,
			context,
			artifacts,
			core,
			temporaryDirectory,
			token,
		});
		this.native = new NativeReports();
	}

	identity() {
		return {
			repository: `${this.context.repo.owner}/${this.context.repo.repo}`,
			repositoryId: String(this.context.payload.repository.id),
			runId: String(this.context.runId),
			attempt: this.execution.attempt,
			sha: this.context.sha,
			workflow:
				process.env.GITHUB_WORKFLOW_REF?.split("@")[0] || this.context.workflow,
		};
	}

	static jobs(value) {
		Protocol.object(value, "job-results");
		if (!Object.keys(value).length)
			throw new Error("job-results must contain the terminal needs context.");
		for (const [name, job] of Object.entries(value)) {
			if (
				!/^[\w-]+$/.test(name) ||
				!["success", "failure", "cancelled", "skipped"].includes(job?.result)
			)
				throw new Error("Invalid job-results entry.");
		}
		return Object.fromEntries(
			Object.entries(value).map(([key, { result }]) => [key, { result }]),
		);
	}

	async discover(directory) {
		const all = await this.github.paginate(
			this.github.rest.actions.listWorkflowRunArtifacts,
			{ ...this.context.repo, run_id: this.context.runId, per_page: 100 },
		);
		const artifacts = all.filter(
			(artifact) =>
				artifact.name.startsWith(`${Protocol.prefix}registration-`) ||
				artifact.name.startsWith(`${Protocol.prefix}result-`),
		);
		if (artifacts.length > 1024)
			throw new Error("Report artifact count exceeds 1024.");
		let bytes = 0;
		for (const artifact of artifacts) {
			if (
				!/^ci-report-v2-(registration|result)-[a-f0-9-]{36}$/.test(
					artifact.name,
				) ||
				artifact.workflow_run?.id !== this.context.runId ||
				String(artifact.workflow_run?.repository_id) !==
					String(this.context.payload.repository.id)
			)
				throw new Error("Invalid report artifact provenance.");
			if (artifact.expired)
				throw new Error(
					`Report artifact ${artifact.name} expired. Rerun its producer.`,
				);
			bytes += artifact.size_in_bytes;
		}
		if (bytes > 1024 * 1024 * 1024)
			throw new Error("Run report artifacts exceed 1 GiB.");
		if (
			new Set(artifacts.map((artifact) => artifact.name)).size !==
			artifacts.length
		)
			throw new Error("Duplicate immutable report artifacts.");
		if (artifacts.length)
			await new ArtifactDownload({
				client: this.artifacts,
				core: this.core,
			}).download({
				artifactIds: artifacts.map((artifact) => artifact.id).join(","),
				destination: directory,
				mergeMultiple: false,
				skipDecompress: false,
				findBy: {
					token: this.token,
					repositoryOwner: this.context.repo.owner,
					repositoryName: this.context.repo.repo,
					workflowRunId: this.context.runId,
				},
			});
		return artifacts;
	}

	async collect({ jobs, reporters }) {
		const selectedReporters = Reporters.parse(reporters);
		jobs = Collector.jobs(jobs);
		if (Object.values(jobs).some((job) => job.result === "cancelled"))
			throw new Error(
				"Producer cancellation stops collection and publication.",
			);
		const directory = fs.mkdtempSync(
			path.join(this.temporaryDirectory, "ci-collection-"),
		);
		const inputs = path.join(directory, "inputs");
		fs.mkdirSync(inputs);
		try {
			const artifacts = await this.discover(inputs);
			const registrations = artifacts
				.filter((artifact) =>
					artifact.name.startsWith(`${Protocol.prefix}registration-`),
				)
				.map((artifact) => {
					const stage =
						artifacts.length === 1 ? inputs : path.join(inputs, artifact.name);
					const record = Protocol.registration(
						Protocol.read(stage, "registration.json"),
						this.identity(),
					);
					if (artifact.name !== `${Protocol.prefix}registration-${record.id}`)
						throw new Error("Registration artifact identity changed.");
					return {
						...record,
						registrationDigest: Protocol.digest(
							fs.readFileSync(Protocol.file(stage, "registration.json")),
						),
					};
				});
			const { selected, errors } = await this.execution.select(registrations);
			for (const artifact of artifacts.filter((item) =>
				item.name.startsWith(`${Protocol.prefix}result-`),
			))
				if (
					!registrations.some(
						(item) => artifact.name === `${Protocol.prefix}result-${item.id}`,
					)
				)
					throw new Error("Result has no immutable registration.");
			const collection = {
				version: Protocol.version,
				identity: this.identity(),
				jobs,
				reporters: selectedReporters,
				checks: [],
				datasets: [],
				errors,
			};
			for (const { registration, job } of selected) {
				const check = { ...registration, job };
				collection.checks.push(check);
				const artifact = artifacts.find(
					(item) => item.name === `${Protocol.prefix}result-${registration.id}`,
				);
				if (!artifact) {
					errors.push(
						`${registration.check.name}: registered check did not retain its result. Open job ${job.id}.`,
					);
					continue;
				}
				const stage =
					artifacts.length === 1 ? inputs : path.join(inputs, artifact.name);
				const result = Protocol.read(stage, "result.json");
				if (
					result.version !== Protocol.version ||
					result.id !== registration.id ||
					result.registrationDigest !== registration.registrationDigest ||
					JSON.stringify(result.execution) !==
						JSON.stringify(registration.execution) ||
					JSON.stringify(result.source) !== JSON.stringify(registration.source)
				)
					throw new Error("Result does not match its immutable registration.");
				if (
					!["success", "failure", "cancelled"].includes(result.outcome) ||
					!Array.isArray(result.errors) ||
					result.errors.some((error) => typeof error !== "string") ||
					!Array.isArray(result.assets) ||
					result.assets.length > 512
				)
					throw new Error("Invalid result contract.");
				check.result = result;
				const pr = this.context.payload.pull_request;
				const expectedSha =
					registration.source.kind === "pr-head"
						? pr?.head.sha
						: this.context.sha;
				if (
					registration.source.sha !== expectedSha ||
					(registration.source.kind === "pr-merge" && !pr) ||
					(registration.source.kind === "branch" && pr)
				)
					throw new Error(
						"Registered source does not match the originating event.",
					);
				for (const selector of registration.check.reports) {
					const matches = result.assets.filter(
						(asset) =>
							JSON.stringify(asset.selector) === JSON.stringify(selector),
					);
					if (!selector.optional && !matches.length)
						result.errors.push(
							`Missing required ${selector.kind}: ${selector.pattern}`,
						);
				}
				const destination = path.join(directory, "checks", registration.id);
				fs.mkdirSync(destination, { recursive: true });
				const verifiedAssets = [];
				const aspects = new Set();
				for (const asset of result.assets) {
					try {
						const aspect = `${asset.selector.kind}:${asset.file}`;
						if (aspects.has(aspect))
							throw new Error("Duplicate report aspect.");
						aspects.add(aspect);
						if (
							!asset.file.startsWith("reports/") ||
							!path.matchesGlob(asset.file.slice(8), asset.selector.pattern)
						)
							throw new Error(
								"Asset path does not match its promised selector.",
							);
						const validated = this.native.verify(stage, asset);
						if (
							!registration.check.reports.some(
								(selector) =>
									JSON.stringify(selector) === JSON.stringify(asset.selector),
							)
						)
							throw new Error("Result contains an undeclared report selector.");
						Object.assign(asset, validated);
						if (asset.invalid) {
							delete asset.data;
							result.errors.push(`${asset.file}: ${asset.invalid}`);
						}
						const target = path.join(destination, asset.file);
						fs.mkdirSync(path.dirname(target), { recursive: true });
						if (!fs.existsSync(target))
							fs.copyFileSync(Protocol.file(stage, asset.file), target);
						asset.file = `checks/${registration.id}/${asset.file}`;
						verifiedAssets.push(asset);
					} catch (error) {
						result.errors.push(`Invalid report asset: ${error.message}`);
					}
				}
				result.assets = verifiedAssets;
			}
			this.datasets(collection);
			await new CoverageBaseline(this).attach(collection);
			Protocol.write(directory, "collection.json", collection);
			fs.rmSync(inputs, { recursive: true, force: true });
			return { directory, collection };
		} catch (error) {
			fs.rmSync(directory, { recursive: true, force: true });
			throw error;
		}
	}

	datasets(collection) {
		const datasets = new Map();
		const owners = new Map();
		for (const check of collection.checks) {
			for (const selector of check.check.reports.filter(
				(report) => report.kind === "coverage",
			)) {
				const label = `${check.check.project === "." ? "root" : check.check.project}/${selector.dataset}`;
				const key = `${label}:${check.source.sha}`;
				const assets = (check.result?.assets || []).filter(
					(asset) =>
						!asset.invalid &&
						JSON.stringify(asset.selector) === JSON.stringify(selector),
				);
				if (selector.optional && !assets.length) continue;
				let dataset = datasets.get(key);
				if (!dataset) {
					dataset = {
						id: Protocol.digest(key).slice(0, 24),
						label,
						project: check.check.project,
						source: check.source,
						language: selector.language || assets[0]?.language,
						role: selector.role,
						assets: [],
						errors: [],
						checkId: check.id,
					};
					datasets.set(key, dataset);
				} else if (dataset.checkId !== check.id)
					dataset.errors.push(
						"Overlapping coverage executions require a native provider merge.",
					);
				if (!assets.length)
					dataset.errors.push("Required coverage evidence is missing.");
				dataset.assets.push(...assets);
				if (
					dataset.assets.some(
						(asset) =>
							asset.measurementDigest !== dataset.assets[0].measurementDigest,
					)
				)
					dataset.errors.push(
						"Alternative coverage representations cover different source lines.",
					);
				if (
					new Set(dataset.assets.map((asset) => asset.format)).size !==
					dataset.assets.length
				)
					dataset.errors.push(
						"Multiple files of one coverage format require a native provider merge.",
					);
				if (
					dataset.assets.some(
						(asset) =>
							asset.data.coverage.lines.total !==
								dataset.assets[0].data.coverage.lines.total ||
							asset.data.coverage.lines.covered !==
								dataset.assets[0].data.coverage.lines.covered ||
							JSON.stringify(
								[...new Set(Object.values(asset.sourceMap))].sort(),
							) !==
								JSON.stringify(
									[
										...new Set(Object.values(dataset.assets[0].sourceMap)),
									].sort(),
								),
					)
				)
					dataset.errors.push(
						"Alternative coverage representations describe different measurements.",
					);
				for (const asset of assets)
					for (const source of Object.values(asset.sourceMap)) {
						if (selector.role !== "primary") continue;
						const owner = owners.get(`${check.source.sha}:${source}`);
						if (owner && owner !== key) {
							dataset.errors.push(
								"Primary coverage datasets overlap; merge them in the provider.",
							);
							datasets
								.get(owner)
								.errors.push(
									"Primary coverage datasets overlap; merge them in the provider.",
								);
						}
						owners.set(`${check.source.sha}:${source}`, key);
					}
			}
		}
		collection.datasets = [...datasets.values()].map((dataset) => ({
			...dataset,
			digest: Protocol.digest(
				dataset.assets
					.map((asset) => asset.sha256)
					.sort()
					.join("\n"),
			),
		}));
		for (const dataset of collection.datasets)
			collection.errors.push(
				...dataset.errors.map((error) => `${dataset.label}: ${error}`),
			);
	}
}
