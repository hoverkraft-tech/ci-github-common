import { fileURLToPath } from "node:url";
import format from "@commitlint/format";
import lint from "@commitlint/lint";
import load from "@commitlint/load";

export async function run({
	core,
	context,
	cwd = process.env.GITHUB_WORKSPACE || process.cwd(),
}) {
	const title = context.payload.pull_request?.title;
	if (typeof title !== "string" || !title.trim()) {
		core.setFailed("A non-empty pull request title is required.");
		return;
	}

	let config = await load({}, { cwd });
	// Match commitlint's --default-config behavior without overriding repository rules.
	if (Object.keys(config.rules).length === 0) {
		config = await load(
			{
				extends: [
					fileURLToPath(import.meta.resolve("@commitlint/config-conventional")),
				],
			},
			{ cwd },
		);
	}
	const result = await lint(title, config.rules, {
		parserOpts: config.parserPreset?.parserOpts,
		plugins: config.plugins,
		ignores: config.ignores,
		defaultIgnores: config.defaultIgnores ?? false,
	});

	core.info(format({ valid: result.valid, results: [result] }));
	for (const warning of result.warnings) {
		core.warning(`${warning.message} [${warning.name}]`);
	}
	if (!result.valid) {
		core.setFailed(
			"Pull request title does not match the repository commitlint configuration.",
		);
	}
}
