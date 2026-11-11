import assert from "node:assert/strict";
import { posix as path } from "node:path";

class DistributionOutputs {
	constructor(github, repo, options) {
		this.github = github;
		this.repo = repo;
		this.options = options;
		this.resolved = new Map();
	}

	async resolve(ref, packages) {
		this.resolved.clear();
		if (!this.options.outputDirectories.some((output) => /[*?]/.test(output)))
			return;
		if (!packages.length) return;
		assert(ref, "Expected a trusted revision for output discovery");
		const { data } = await this.github.rest.git.getTree({
			...this.repo,
			tree_sha: ref,
			recursive: "1",
		});
		assert(!data.truncated, "Cannot discover outputs from a truncated tree");
		for (const directory of packages) {
			const outputs = this.options.outputDirectories.flatMap((output) => {
				const pattern = directory === "." ? output : `${directory}/${output}`;
				if (!/[*?]/.test(output)) return [pattern];
				return this.match(data.tree, pattern);
			});
			this.options.validateOutputDirectories(outputs);
			this.resolved.set(directory, outputs.sort());
		}
	}

	match(tree, pattern) {
		const matches = tree.filter(
			(entry) =>
				this.options.safePath(entry.path) &&
				!entry.path.split("/").includes("node_modules") &&
				path.matchesGlob(entry.path, pattern),
		);
		const directories = [];
		for (const entry of matches) {
			assert(
				entry.mode !== "120000" && entry.type !== "commit",
				"Output patterns cannot select symlinks or submodules",
			);
			if (entry.type !== "tree") continue;
			assert(entry.mode === "040000", "Expected a regular output directory");
			directories.push(entry.path);
		}
		assert(
			directories.length,
			`Output pattern matched no directories: ${pattern}`,
		);
		return directories;
	}

	paths(directory) {
		const resolved = this.resolved.get(directory);
		if (resolved) return resolved;
		assert(
			!this.options.outputDirectories.some((output) => /[*?]/.test(output)),
			"Output patterns must be resolved from the trusted revision",
		);
		return this.options.outputDirectories.map((output) =>
			directory === "." ? output : `${directory}/${output}`,
		);
	}

	contains(directory, filename) {
		return this.paths(directory).some((output) =>
			filename.startsWith(`${output}/`),
		);
	}
}

export { DistributionOutputs };
