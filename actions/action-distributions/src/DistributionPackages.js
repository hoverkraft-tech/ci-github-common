import assert from "node:assert/strict";
import { posix as path } from "node:path";

class DistributionPackages {
	constructor(github, repo, options) {
		this.github = github;
		this.repo = repo;
		this.options = options;
	}

	async discover(ref) {
		const patterns = this.options.directories;
		// Explicit directories retain their existing allowlist semantics.
		if (patterns.length && patterns.every((entry) => !/[*?]/.test(entry)))
			return patterns;
		assert(ref, "Expected a repository revision for package discovery");
		const { data } = await this.github.rest.git.getTree({
			...this.repo,
			tree_sha: ref,
			recursive: "1",
		});
		assert(
			!data.truncated,
			"Cannot discover packages from a truncated repository tree",
		);
		const selected = patterns.length ? patterns : [".", "actions/**"];
		const packages = [];
		for (const entry of data.tree) {
			if (path.basename(entry.path) !== "package.json") continue;
			const directory = path.dirname(entry.path);
			if (
				directory !== "." &&
				(!this.options.safePath(directory) ||
					directory.split("/").some((part) => part === "node_modules"))
			)
				continue;
			if (
				this.options.outputDirectories.some(
					(output) =>
						path.matchesGlob(directory, `**/${output}`) ||
						path.matchesGlob(directory, `**/${output}/**`),
				)
			)
				continue;
			if (!selected.some((pattern) => path.matchesGlob(directory, pattern)))
				continue;
			assert(
				entry.type === "blob" && entry.mode === "100644",
				"Expected a regular package manifest",
			);
			const { data: blob } = await this.github.rest.git.getBlob({
				...this.repo,
				file_sha: entry.sha,
			});
			assert(blob.encoding === "base64", "Unsupported manifest encoding");
			const manifest = JSON.parse(
				Buffer.from(blob.content, "base64").toString("utf8"),
			);
			if (
				[this.options.buildScript, "check:dist"].every(
					(name) =>
						typeof manifest.scripts?.[name] === "string" &&
						manifest.scripts[name].trim(),
				)
			)
				packages.push(directory);
		}
		packages.sort();
		assert(
			!packages.some((directory) =>
				packages.some(
					(other) =>
						other !== directory &&
						(other === "." || directory.startsWith(`${other}/`)),
				),
			),
			"Overlapping working directories",
		);
		return packages;
	}
}

export { DistributionPackages };
