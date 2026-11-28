import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { XMLBuilder } from "fast-xml-parser";
import { CoberturaReport } from "./CoberturaReport.js";
import { GoCoverageProfile } from "./GoCoverageProfile.js";
import { Protocol } from "./Protocol.js";

/** Stage explicit, source-normalized inputs without searching the consumer tree. */
export class CoveragePublication {
	constructor({
		directory,
		actionPath,
		temporaryDirectory,
		execute = execFileSync,
	}) {
		Object.assign(this, { directory, actionPath, temporaryDirectory, execute });
	}

	normalized(asset) {
		const input = fs.readFileSync(Protocol.file(this.directory, asset.file));
		if (Protocol.digest(input) !== asset.sha256)
			throw new Error("Coverage changed after collection.");
		if (asset.format === "golang") {
			for (const source of Object.values(asset.sourceMap))
				Protocol.relative(source);
			return new GoCoverageProfile(input.toString("utf8")).lcov(
				asset.sourceMap,
			);
		}
		if (asset.format === "lcov")
			return input
				.toString("utf8")
				.replace(/^SF:(.+)$/gm, (_line, filename) => {
					const mapped = asset.sourceMap[filename.trim()];
					if (!mapped) throw new Error("LCOV source mapping is missing.");
					return `SF:${Protocol.relative(mapped)}`;
				});
		if (asset.format === "cobertura") {
			const report = new CoberturaReport(input.toString("utf8"));
			for (const item of report.classes)
				item["@_filename"] = Protocol.relative(
					asset.sourceMap[item["@_filename"]],
				);
			report.document.coverage.sources = { source: "." };
			delete report.document["!DOCTYPE"];
			return new XMLBuilder({ ignoreAttributes: false }).build(report.document);
		}
		throw new Error(
			`Unsupported coverage normalization: ${asset.format}. Native evidence is retained.`,
		);
	}

	prepare(dataset, reporter) {
		if (dataset.errors.length || !dataset.assets.length)
			throw new Error("Cannot publish incomplete coverage.");
		const preferred =
			reporter === "github"
				? ["cobertura", "lcov", "golang"]
				: ["golang", "lcov", "cobertura"];
		const asset = preferred
			.map((format) => dataset.assets.find((item) => item.format === format))
			.find(Boolean);
		if (!asset)
			throw new Error(
				`No supported ${reporter} representation for ${dataset.label}.`,
			);
		const stage = path.join(this.directory, "publication", dataset.id);
		fs.mkdirSync(stage, { recursive: true });
		// Preserve the native profile; normalize block spans only for a selected publisher.
		// LCOV avoids the Coveralls Go parser stripping arbitrary module path segments.
		// https://github.com/coverallsapp/coverage-reporter/blob/master/src/coverage_reporter/parsers/golang_parser.cr
		const format = asset.format === "golang" ? "lcov" : asset.format;
		const file = path.join(
			stage,
			format === "lcov" ? "coverage.info" : "coverage.xml",
		);
		fs.writeFileSync(file, this.normalized(asset));
		if (reporter !== "github" || asset.format === "cobertura")
			return { file, format };
		const output = path.join(stage, "coverage.xml");
		const packages = path.join(
			this.temporaryDirectory,
			"ci-coverage-converter",
		);
		if (!fs.existsSync(path.join(packages, "lcov_cobertura"))) {
			this.execute(
				"python3",
				[
					"-I",
					"-m",
					"pip",
					"--isolated",
					"install",
					"--disable-pip-version-check",
					"--no-deps",
					"--no-cache-dir",
					"--only-binary=:all:",
					"--require-hashes",
					"--target",
					packages,
					"-r",
					path.join(this.actionPath, "converters", "requirements.txt"),
				],
				{ cwd: this.actionPath, timeout: 60000, stdio: "pipe" },
			);
		}
		this.execute(
			"python3",
			[
				"-I",
				path.join(this.actionPath, "converters", "lcov.py"),
				packages,
				file,
				output,
			],
			{ cwd: stage, timeout: 30000, stdio: "pipe" },
		);
		const converted = new CoberturaReport(fs.readFileSync(output, "utf8"));
		for (const source of converted.files())
			if (!Object.values(asset.sourceMap).includes(source))
				throw new Error(
					"Converted coverage changed the verified source mapping.",
				);
		return { file: output, format: "cobertura" };
	}
}
