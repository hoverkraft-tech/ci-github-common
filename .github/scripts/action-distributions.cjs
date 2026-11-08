const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const CONFIG = ".github/action-distributions.json";
const BUILDER = ".github/workflows/__rebuild-action-distributions.yml";
const BOT = "dependabot[bot]";
const BOT_ID = 49699333;
const MAX_BYTES = 20 * 1024 * 1024;

class ActionDistributions {
	constructor({ github, context, core }) {
		this.github = github;
		this.context = context;
		this.core = core;
		this.repo = context.repo;
		this.fullName = `${this.repo.owner}/${this.repo.repo}`;
	}

	async configuration() {
		const { data } = await this.github.rest.repos.getContent({
			...this.repo,
			path: CONFIG,
			ref: this.context.payload.repository.default_branch,
		});
		const packages = JSON.parse(Buffer.from(data.content, "base64").toString());
		assert(
			Array.isArray(packages) && packages.length > 0,
			"Expected package directories",
		);
		assert.equal(
			new Set(packages).size,
			packages.length,
			"Duplicate package directory",
		);
		for (const directory of packages) {
			assert(
				typeof directory === "string" &&
					/^actions\/(?:[a-z0-9][a-z0-9-]*\/)*[a-z0-9][a-z0-9-]*$/.test(
						directory,
					),
				"Invalid package directory",
			);
			assert(
				!packages.some(
					(other) => other !== directory && directory.startsWith(`${other}/`),
				),
				"Overlapping package directories",
			);
		}
		return packages;
	}

	async affectedPackages(pr) {
		assert(
			pr.changed_files <= 3000,
			"PR file list exceeds GitHub's supported limit",
		);
		const packages = await this.configuration();
		const files = await this.github.paginate(this.github.rest.pulls.listFiles, {
			...this.repo,
			pull_number: pr.number,
			per_page: 100,
		});
		return packages.filter((directory) =>
			files.some((file) =>
				[file.filename, file.previous_filename].some(
					(name) =>
						name?.startsWith(`${directory}/`) &&
						!name.startsWith(`${directory}/dist/`),
				),
			),
		);
	}

	eligible(pr, sha, branch) {
		return (
			pr.state === "open" &&
			pr.user.login === BOT &&
			pr.user.id === BOT_ID &&
			pr.head.repo?.full_name === this.fullName &&
			pr.base.repo?.full_name === this.fullName &&
			pr.base.ref === this.context.payload.repository.default_branch &&
			pr.head.sha === sha &&
			pr.head.ref === branch &&
			branch.startsWith("dependabot/")
		);
	}

	async build({ workspace, output, execute = execFileSync }) {
		const { pull_request: original } = this.context.payload;
		if (this.context.eventName !== "pull_request" || this.context.actor !== BOT)
			return;
		const { data: pr } = await this.github.rest.pulls.get({
			...this.repo,
			pull_number: original.number,
		});
		if (!this.eligible(pr, original.head.sha, original.head.ref)) return;
		const packages = await this.affectedPackages(pr);
		if (!packages.length) return;
		const files = [];
		for (const directory of packages) {
			const cwd = path.join(workspace, directory);
			execute("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], {
				cwd,
				stdio: "inherit",
			});
			execute("npm", ["run", "build"], { cwd, stdio: "inherit" });
			this.collect(workspace, `${directory}/dist`, files);
		}
		const payload = JSON.stringify(files);
		assert(
			Buffer.byteLength(payload) <= MAX_BYTES,
			"Distribution artifact exceeds size limit",
		);
		fs.mkdirSync(path.dirname(output), { recursive: true });
		fs.writeFileSync(output, payload);
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
			run.actor.login !== BOT ||
			run.actor.id !== BOT_ID ||
			!run.head_branch?.startsWith("dependabot/") ||
			run.run_attempt !== event.run_attempt
		)
			return null;
		const { data: workflow } = await this.github.rest.actions.getWorkflow({
			...this.repo,
			workflow_id: run.workflow_id,
		});
		assert.equal(workflow.path, BUILDER, "Unexpected builder workflow");
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
		if (!this.eligible(pr, run.head_sha, run.head_branch)) return null;
		const packages = await this.affectedPackages(pr);
		return packages.length ? { run, pr, packages } : null;
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
			(artifact) => artifact.name === `action-distributions-${run.run_attempt}`,
		);
		assert.equal(
			matching.length,
			1,
			"Expected one distribution artifact for this attempt",
		);
		assert(
			!matching[0].expired && matching[0].size_in_bytes <= MAX_BYTES,
			"Artifact expired or too large",
		);
		this.core.setOutput("artifact-id", matching[0].id);
	}

	readPayload(filename, packages) {
		assert(
			fs.statSync(filename).size <= MAX_BYTES,
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
					file.path.startsWith(`${directory}/dist/`),
				),
				"File outside allowed distributions",
			);
			assert(
				typeof file.contents === "string" &&
					Buffer.from(file.contents, "base64").toString("base64") ===
						file.contents,
				"Invalid file encoding",
			);
			names.add(file.path);
		}
		for (const directory of packages) {
			assert(
				names.has(`${directory}/dist/index.js`) &&
					names.has(`${directory}/dist/licenses.txt`),
				"Missing bundle or licenses",
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
					entry.path.startsWith(`${directory}/dist/`),
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
					message: {
						headline:
							"build: regenerate action distributions [dependabot skip]",
					},
					fileChanges,
				},
			},
		);
		this.core.info("Committed regenerated distributions to the Dependabot PR.");
	}
}

module.exports = { ActionDistributions };
