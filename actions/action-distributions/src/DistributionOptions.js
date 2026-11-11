import assert from "node:assert/strict";

const AUTHOR_PRESETS = {
	dependabot: {
		login: "dependabot[bot]",
		id: 49699333,
		"branch-prefix": "dependabot/",
		"commit-message-suffix": "[dependabot skip]",
	},
	renovate: {
		login: "renovate[bot]",
		id: 29139614,
		"branch-prefix": "renovate/",
	},
};

class DistributionOptions {
	constructor(options = {}) {
		this.directories = this.lines(options.workingDirectories ?? "");
		this.outputDirectories = this.lines(options.outputDirectory ?? "dist");
		this.installCommand = this.command(
			options.installCommand ?? "npm ci --no-audit --no-fund",
		);
		this.runScriptCommand = this.command(options.runScriptCommand ?? "npm run");
		this.ignoreScripts = options.ignoreScripts ?? "true";
		this.maxBytes = Number(options.maxArtifactSize ?? 20) * 1024 * 1024;
		this.requiredFiles = this.lines(
			options.requiredFiles ?? "index.js\nlicenses.txt",
		);
		this.buildScript = options.buildScript ?? "build";
		this.artifactName = options.artifactName ?? "action-distributions";
		this.commitMessage =
			options.commitMessage ?? "build: regenerate action distributions";
		this.authors = this.authorRules(
			options.pullRequestAuthors ?? '["dependabot","renovate"]',
		);
		assert.equal(
			new Set(this.directories).size,
			this.directories.length,
			"Duplicate working directory",
		);
		for (const directory of this.directories) {
			assert(
				directory === "." || this.safePattern(directory),
				"Invalid working directory",
			);
			assert(
				!this.directories.some(
					(other) =>
						other !== directory &&
						(other === "." || directory.startsWith(`${other}/`)),
				),
				"Overlapping working directories",
			);
		}
		assert(
			this.outputDirectories.length > 0 &&
				this.outputDirectories.every((entry) => this.safePath(entry)),
			"Invalid output directory",
		);
		assert(
			new Set(this.outputDirectories).size === this.outputDirectories.length &&
				!this.outputDirectories.some((directory) =>
					this.outputDirectories.some((other) =>
						directory.startsWith(`${other}/`),
					),
				),
			"Duplicate or overlapping output directories",
		);
		assert(
			["true", "false"].includes(this.ignoreScripts),
			"Invalid ignore-scripts value",
		);
		assert(
			Number.isSafeInteger(this.maxBytes / 1024 / 1024) &&
				this.maxBytes >= 1024 * 1024 &&
				this.maxBytes <= 128 * 1024 * 1024,
			"Artifact size must be an integer between 1 and 128 MiB",
		);
		assert(
			this.requiredFiles.every((file) => this.safePath(file)),
			"Invalid required file",
		);
		assert(
			/^[a-zA-Z0-9_][a-zA-Z0-9_:-]*$/.test(this.buildScript),
			"Invalid npm script name",
		);
		assert(
			/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/.test(this.artifactName),
			"Invalid artifact name",
		);
		assert(
			typeof this.commitMessage === "string" &&
				this.commitMessage.trim() &&
				!/[\r\n]/.test(this.commitMessage),
			"Expected a single-line commit headline",
		);
	}

	command(value) {
		assert(
			typeof value === "string" && value.trim(),
			"Expected a package command",
		);
		const parts = value.trim().split(/\s+/);
		assert(
			parts.every((part) => /^[a-zA-Z0-9_./=:-]+$/.test(part)),
			"Expected command arguments without shell syntax",
		);
		return parts;
	}

	lines(value) {
		assert(typeof value === "string", "Expected newline-separated input");
		return value
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	}

	safePath(value) {
		return (
			typeof value === "string" &&
			value
				.split("/")
				.every((part) => /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(part))
		);
	}

	safePattern(value) {
		return value
			.split("/")
			.every(
				(part) =>
					part !== "." &&
					part !== ".." &&
					/^[a-zA-Z0-9_*?][a-zA-Z0-9_.*?-]*$/.test(part),
			);
	}

	authorRules(value) {
		const rules = JSON.parse(value);
		assert(
			Array.isArray(rules) && rules.length > 0,
			"Expected allowed PR authors",
		);
		return rules.map((entry) => {
			const rule = typeof entry === "string" ? AUTHOR_PRESETS[entry] : entry;
			assert(
				rule &&
					typeof rule.login === "string" &&
					/^[a-zA-Z0-9-]+(?:\[bot\])?$/.test(rule.login),
				"Invalid PR author login or preset",
			);
			assert(
				Number.isSafeInteger(rule.id) && rule.id > 0,
				"Expected immutable PR author ID",
			);
			assert(
				rule["branch-prefix"] === undefined ||
					(typeof rule["branch-prefix"] === "string" &&
						rule["branch-prefix"].length > 0),
				"Invalid author branch prefix",
			);
			assert(
				rule["commit-message-suffix"] === undefined ||
					(typeof rule["commit-message-suffix"] === "string" &&
						!/[\r\n]/.test(rule["commit-message-suffix"])),
				"Invalid commit suffix",
			);
			return { ...rule };
		});
	}

	author(pr, actor) {
		return this.authors.find(
			(rule) =>
				pr.user.login === rule.login &&
				pr.user.id === rule.id &&
				actor?.login === rule.login &&
				actor.id === rule.id &&
				(!rule["branch-prefix"] ||
					pr.head.ref.startsWith(rule["branch-prefix"])),
		);
	}

	outputPaths(directory) {
		return this.outputDirectories.map((output) =>
			directory === "." ? output : `${directory}/${output}`,
		);
	}

	containsOutput(directory, filename) {
		return this.outputPaths(directory).some((output) =>
			filename.startsWith(`${output}/`),
		);
	}

	artifact(attempt) {
		return `${this.artifactName}-${attempt}`;
	}

	headline(author) {
		return [this.commitMessage, author["commit-message-suffix"]]
			.filter(Boolean)
			.join(" ");
	}

	static environment() {
		return {
			workingDirectories: process.env.WORKING_DIRECTORIES,
			outputDirectory: process.env.OUTPUT_DIRECTORY,
			installCommand: process.env.INSTALL_COMMAND,
			runScriptCommand: process.env.RUN_SCRIPT_COMMAND,
			ignoreScripts: process.env.IGNORE_SCRIPTS,
			maxArtifactSize: process.env.MAX_ARTIFACT_SIZE,
			requiredFiles: process.env.REQUIRED_FILES,
			pullRequestAuthors: process.env.PULL_REQUEST_AUTHORS,
			buildScript: process.env.BUILD_SCRIPT,
			artifactName: process.env.ARTIFACT_NAME,
			commitMessage: process.env.COMMIT_MESSAGE,
		};
	}
}

export { DistributionOptions };
