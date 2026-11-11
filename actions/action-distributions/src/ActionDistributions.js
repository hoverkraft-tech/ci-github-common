import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { DistributionCommit } from "./DistributionCommit.js";
import { DistributionOptions } from "./DistributionOptions.js";
import { DistributionPackages } from "./DistributionPackages.js";
import { DistributionWorkflow } from "./DistributionWorkflow.js";

const GENERATED_BY = "Generated-by: ci-github-common/action-distributions";
const INLINE_COMMIT_BYTES = 20 * 1024 * 1024;

class ActionDistributions {
	constructor({
		github,
		context,
		core,
		options = DistributionOptions.environment(),
	}) {
		this.options = new DistributionOptions(options);
		this.github = github;
		this.context = context;
		this.core = core;
		this.repo = context.repo;
		this.fullName = `${this.repo.owner}/${this.repo.repo}`;
	}

	async run(operation, { workspace, artifactPath } = {}) {
		switch (operation) {
			case "discover": {
				const packages = await this.packages(this.context.sha);
				this.core.setOutput("working-directories", JSON.stringify(packages));
				return;
			}
			case "prepare-build":
				return this.prepareBuild();
			case "build":
				return this.build({ workspace, output: artifactPath });
			case "prepare-commit":
				return this.prepare();
			case "commit":
				return this.commit(artifactPath);
			default:
				throw new Error(`Unsupported distribution operation: ${operation}`);
		}
	}

	async packages(ref) {
		return new DistributionPackages(
			this.github,
			this.repo,
			this.options,
		).discover(ref);
	}

	async affectedPackages(pr) {
		assert(
			pr.changed_files <= 3000,
			"PR file list exceeds GitHub's supported limit",
		);
		// The writer's allowlist is always derived from the trusted base, never PR manifests.
		const packages = await this.packages(pr.base.sha);
		const files = await this.github.paginate(this.github.rest.pulls.listFiles, {
			...this.repo,
			pull_number: pr.number,
			per_page: 100,
		});
		return packages.filter((directory) =>
			files.some((file) =>
				[file.filename, file.previous_filename].some(
					(name) =>
						typeof name === "string" &&
						(directory === "." || name.startsWith(`${directory}/`)) &&
						!this.options.containsOutput(directory, name),
				),
			),
		);
	}

	eligible(pr, sha, branch, actor) {
		return (
			pr.state === "open" &&
			this.options.author(pr, actor) &&
			pr.head.repo?.full_name === this.fullName &&
			pr.base.repo?.full_name === this.fullName &&
			pr.base.ref === this.context.payload.repository.default_branch &&
			pr.head.sha === sha &&
			pr.head.ref === branch
		);
	}

	async generatedHead(sha) {
		const { data } = await this.github.rest.repos.getCommit({
			...this.repo,
			ref: sha,
		});
		return data.commit.message.split(/\r?\n/).includes(GENERATED_BY);
	}

	async buildSource() {
		const { pull_request: original, sender } = this.context.payload;
		if (this.context.eventName !== "pull_request") return null;
		const { data: pr } = await this.github.rest.pulls.get({
			...this.repo,
			pull_number: original.number,
		});
		if (
			!this.eligible(pr, original.head.sha, original.head.ref, sender) ||
			(await this.generatedHead(pr.head.sha))
		)
			return null;
		const packages = await this.affectedPackages(pr);
		return packages.length ? { pr, packages } : null;
	}

	async prepareBuild() {
		const source = await this.buildSource();
		if (source) {
			this.core.setOutput("head-sha", source.pr.head.sha);
			this.core.setOutput(
				"working-directories",
				JSON.stringify(source.packages),
			);
		}
	}

	async build({ workspace, output, execute = execFileSync }) {
		const source = await this.buildSource();
		if (!source) return;
		const { packages } = source;
		const files = [];
		for (const directory of packages) {
			const cwd = path.join(workspace, directory);
			const [installer, ...installArgs] = this.options.installCommand;
			if (this.options.ignoreScripts === "true")
				installArgs.push("--ignore-scripts");
			execute(installer, installArgs, { cwd, stdio: "inherit" });
			const [runner, ...runArgs] = this.options.runScriptCommand;
			execute(runner, [...runArgs, this.options.buildScript], {
				cwd,
				stdio: "inherit",
			});
			for (const outputPath of this.options.outputPaths(directory))
				this.collect(workspace, outputPath, files);
		}
		const payload = JSON.stringify(files);
		assert(
			Buffer.byteLength(payload) <= this.options.maxBytes,
			"Distribution artifact exceeds size limit",
		);
		fs.mkdirSync(path.dirname(output), { recursive: true });
		fs.writeFileSync(output, payload);
		this.readPayload(output, packages);
		this.core.setOutput("built", "true");
	}

	collect(workspace, relative, files) {
		const absolute = path.join(workspace, relative);
		const stat = fs.lstatSync(absolute);
		assert(!stat.isSymbolicLink(), "Distribution symlinks are unsupported");
		if (stat.isDirectory()) {
			for (const name of fs.readdirSync(absolute).sort())
				this.collect(workspace, `${relative}/${name}`, files);
			return;
		}
		assert(stat.isFile(), "Expected a regular distribution file");
		assert(
			stat.size <= 50 * 1024 * 1024,
			"Distribution file exceeds size limit",
		);
		assert(files.length < 1000, "Invalid distribution file count");
		files.push({
			path: relative,
			contents: fs.readFileSync(absolute).toString("base64"),
		});
	}

	async source() {
		if (this.context.eventName !== "workflow_run") return null;
		const event = this.context.payload.workflow_run;
		const { data: run } = await this.github.rest.actions.getWorkflowRun({
			...this.repo,
			run_id: event.id,
		});
		if (
			run.conclusion !== "success" ||
			run.event !== "pull_request" ||
			run.head_repository?.full_name !== this.fullName ||
			!run.head_branch ||
			run.run_attempt !== event.run_attempt
		)
			return null;
		await new DistributionWorkflow(this.github, this.context).validate(run);
		const prs = await this.github.paginate(this.github.rest.pulls.list, {
			...this.repo,
			state: "open",
			head: `${this.repo.owner}:${run.head_branch}`,
			per_page: 100,
		});
		if (prs.length !== 1) return null;
		const { data: pr } = await this.github.rest.pulls.get({
			...this.repo,
			pull_number: prs[0].number,
		});
		if (
			!this.eligible(pr, run.head_sha, run.head_branch, run.actor) ||
			(await this.generatedHead(pr.head.sha))
		)
			return null;
		const packages = await this.affectedPackages(pr);
		return packages.length
			? { run, pr, packages, author: this.options.author(pr, run.actor) }
			: null;
	}

	async prepare() {
		const source = await this.source();
		if (!source) return;
		const { run } = source;
		const artifacts = await this.github.paginate(
			this.github.rest.actions.listWorkflowRunArtifacts,
			{
				...this.repo,
				run_id: run.id,
				per_page: 100,
			},
		);
		const matching = artifacts.filter(
			(artifact) => artifact.name === this.options.artifact(run.run_attempt),
		);
		assert.equal(
			matching.length,
			1,
			"Expected one distribution artifact for this attempt",
		);
		assert(
			!matching[0].expired &&
				matching[0].size_in_bytes <= this.options.maxBytes,
			"Artifact expired or too large",
		);
		this.core.setOutput("artifact-id", matching[0].id);
	}

	readPayload(filename, packages) {
		assert(
			fs.statSync(filename).size <= this.options.maxBytes,
			"Distribution artifact exceeds size limit",
		);
		const files = JSON.parse(fs.readFileSync(filename, "utf8"));
		assert(
			Array.isArray(files) && files.length > 0 && files.length <= 1000,
			"Invalid distribution file count",
		);
		const names = new Set();
		for (const file of files) {
			assert(
				typeof file.path === "string" && !names.has(file.path),
				"Invalid or duplicate distribution path",
			);
			assert(
				file.path
					.split("/")
					.every((part) => /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(part)),
				"Unsafe distribution path",
			);
			assert(
				packages.some((directory) =>
					this.options.containsOutput(directory, file.path),
				),
				"File outside allowed distributions",
			);
			assert(
				typeof file.contents === "string" &&
					Buffer.from(file.contents, "base64").toString("base64") ===
						file.contents,
				"Invalid file encoding",
			);
			assert(
				Buffer.byteLength(file.contents, "base64") <= 50 * 1024 * 1024,
				"Distribution file exceeds size limit",
			);
			names.add(file.path);
		}
		for (const output of packages.flatMap((directory) =>
			this.options.outputPaths(directory),
		)) {
			const prefix = `${output}/`;
			assert(
				[...names].some((name) => name.startsWith(prefix)) &&
					this.options.requiredFiles.every((name) =>
						names.has(`${prefix}${name}`),
					),
				"Missing required distribution files",
			);
		}
		return files;
	}

	async changes(source, filename) {
		const files = this.readPayload(filename, source.packages);
		const { data: tree } = await this.github.rest.git.getTree({
			...this.repo,
			tree_sha: source.pr.head.sha,
			recursive: "1",
		});
		assert(!tree.truncated, "Cannot compare a truncated repository tree");
		const existing = new Map();
		for (const entry of tree.tree) {
			if (
				!source.packages.some((directory) =>
					this.options.containsOutput(directory, entry.path),
				)
			)
				continue;
			assert(
				entry.type === "tree" ||
					(entry.type === "blob" && entry.mode === "100644"),
				"Unsupported distribution file mode",
			);
			if (entry.type === "blob") existing.set(entry.path, entry.sha);
		}
		const additions = files.filter((file) => {
			const bytes = Buffer.from(file.contents, "base64");
			const sha = createHash("sha1")
				.update(`blob ${bytes.length}\0`)
				.update(bytes)
				.digest("hex");
			return existing.get(file.path) !== sha;
		});
		const names = new Set(files.map((file) => file.path));
		const deletions = [...existing.keys()]
			.filter((name) => !names.has(name))
			.map((name) => ({ path: name }));
		return { additions, deletions };
	}

	async commit(filename) {
		const source = await this.source();
		if (!source)
			return this.core.info(
				"PR is no longer eligible or its head changed; no commit.",
			);
		const fileChanges = await this.changes(source, filename);
		if (!fileChanges.additions.length && !fileChanges.deletions.length)
			return this.core.info("Distributions are already current.");
		const message = {
			headline: this.options.headline(source.author),
			body: GENERATED_BY,
		};
		if (Buffer.byteLength(JSON.stringify(fileChanges)) > INLINE_COMMIT_BYTES) {
			await new DistributionCommit(this.github, this.repo).create({
				branch: source.pr.head.ref,
				head: source.pr.head.sha,
				message,
				fileChanges,
			});
		} else
			await this.github.graphql(
				`mutation($input: CreateCommitOnBranchInput!) {
			createCommitOnBranch(input: $input) { commit { oid } }
		}`,
				{
					input: {
						branch: {
							repositoryNameWithOwner: this.fullName,
							branchName: source.pr.head.ref,
						},
						expectedHeadOid: source.pr.head.sha,
						message,
						fileChanges,
					},
				},
			);
		this.core.info("Committed regenerated distributions to the automation PR.");
	}
}

export { ActionDistributions, GENERATED_BY };
