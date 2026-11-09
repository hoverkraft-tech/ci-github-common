import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

class DistributionTest {
	constructor({ io, exec }) {
		this.io = io;
		this.exec = exec;
	}

	async run({
		workingDirectory = ".",
		outputDirectory = "dist",
		temporaryDirectory = os.tmpdir(),
	} = {}) {
		const cwd = path.resolve(workingDirectory);
		const manifest = JSON.parse(
			fs.readFileSync(path.join(cwd, "package.json"), "utf8"),
		);
		assert(
			manifest.scripts?.["test:distribution"]?.trim(),
			"Expected a test:distribution script that loads ACTION_ENTRYPOINT",
		);
		assert(
			!path.isAbsolute(outputDirectory) &&
				outputDirectory
					.split(/[\\/]/)
					.every((part) => part && part !== "." && part !== ".."),
			"Expected a package-relative output directory",
		);
		const source = path.join(cwd, outputDirectory);
		this.checkFiles(source);
		assert(
			fs.statSync(path.join(source, "index.js")).isFile(),
			"Expected a distribution entrypoint",
		);
		const temporary = fs.mkdtempSync(
			path.join(temporaryDirectory, "action-distribution-"),
		);
		try {
			const distribution = path.join(temporary, "dist");
			await this.io.cp(source, distribution, { recursive: true });
			await this.exec.exec("npm", ["run", "test:distribution"], {
				cwd,
				env: {
					...process.env,
					NODE_PATH: "",
					NODE_OPTIONS: "",
					ACTION_ENTRYPOINT: path.join(distribution, "index.js"),
				},
			});
		} finally {
			await this.io.rmRF(temporary);
		}
	}

	checkFiles(filename) {
		const stat = fs.lstatSync(filename);
		assert(
			!stat.isSymbolicLink(),
			"Distribution symlinks would escape isolation",
		);
		if (stat.isDirectory()) {
			for (const name of fs.readdirSync(filename))
				this.checkFiles(path.join(filename, name));
		} else assert(stat.isFile(), "Expected regular distribution files");
	}
}

export { DistributionTest };
