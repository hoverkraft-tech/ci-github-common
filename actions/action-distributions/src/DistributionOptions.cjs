const assert = require("node:assert/strict");

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
		this.directories = this.lines(options.workingDirectories ?? ".");
		this.outputDirectory = options.outputDirectory ?? "dist";
		this.requiredFiles = this.lines(
			options.requiredFiles ?? "index.js\nlicenses.txt",
		);
		this.buildScript = options.buildScript ?? "build";
		this.artifactName = options.artifactName ?? "action-distributions";
		this.buildWorkflow = options.buildWorkflow;
		this.commitMessage =
			options.commitMessage ?? "build: regenerate action distributions";
		this.authors = this.authorRules(
			options.pullRequestAuthors ?? '["dependabot","renovate"]',
		);
		assert(this.directories.length > 0, "Expected working directories");
		assert.equal(
			new Set(this.directories).size,
			this.directories.length,
			"Duplicate working directory",
		);
		for (const directory of this.directories) {
			assert(
				directory === "." || this.safePath(directory),
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
		assert(this.safePath(this.outputDirectory), "Invalid output directory");
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
		if (this.buildWorkflow !== undefined) {
			assert(
				/^\.github\/workflows\/[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.ya?ml$/.test(
					this.buildWorkflow,
				),
				"Invalid builder workflow path",
			);
		}
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

	outputPath(directory) {
		return directory === "."
			? this.outputDirectory
			: `${directory}/${this.outputDirectory}`;
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
			requiredFiles: process.env.REQUIRED_FILES,
			pullRequestAuthors: process.env.PULL_REQUEST_AUTHORS,
			buildScript: process.env.BUILD_SCRIPT,
			artifactName: process.env.ARTIFACT_NAME,
			buildWorkflow: process.env.BUILD_WORKFLOW || undefined,
			commitMessage: process.env.COMMIT_MESSAGE,
		};
	}
}

module.exports = { DistributionOptions };
