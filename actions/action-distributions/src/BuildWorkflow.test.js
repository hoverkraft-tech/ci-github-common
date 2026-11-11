import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";

test("configures eligible affected packages and forwards shared commands only to the read-only builder", () => {
	// Arrange
	const workflow = parse(
		fs.readFileSync(
			new URL(
				"../../../.github/workflows/action-distributions.yml",
				import.meta.url,
			),
			"utf8",
		),
	);
	const steps = workflow.jobs.rebuild.steps;
	const sharedSetup = steps.find((step) =>
		step.uses?.startsWith(
			"hoverkraft-tech/ci-github-nodejs/actions/setup-node@",
		),
	);
	const commands = steps.find((step) =>
		step.uses?.startsWith(
			"hoverkraft-tech/ci-github-nodejs/actions/get-package-manager@",
		),
	);
	const runtime = steps.find((step) =>
		step.uses?.startsWith("actions/setup-node@"),
	);
	const build = steps.find((step) => step.id === "build");
	// Act
	const directory = sharedSetup.with["working-directory"];
	const writerActions = workflow.jobs.commit.steps.map((step) => step.uses);
	// Assert
	assert.equal(
		directory,
		`source/\${{ fromJSON(steps.prepare.outputs.working-directories)[0] }}`,
	);
	assert.equal(commands.with["working-directory"], directory);
	assert.equal(sharedSetup.with["install-dependencies"], "false");
	for (const step of [sharedSetup, commands, runtime, build])
		assert.equal(step.if, "steps.prepare.outputs.head-sha");
	assert(steps.indexOf(sharedSetup) < steps.indexOf(runtime));
	assert(steps.indexOf(runtime) < steps.indexOf(build));
	assert.equal(runtime.with["node-version"], `\${{ inputs.node-version }}`);
	assert.equal(
		build.with["install-command"],
		`\${{ steps.package-manager.outputs.install-command }}`,
	);
	assert.equal(
		build.with["run-script-command"],
		`\${{ steps.package-manager.outputs.run-script-command }}`,
	);
	assert.equal(build.with["ignore-scripts"], `\${{ inputs.ignore-scripts }}`);
	assert.deepEqual(workflow.jobs.rebuild.permissions, {
		contents: "read",
		"pull-requests": "read",
	});
	assert(
		!writerActions.some((action) => /ci-github-nodejs|setup-node/.test(action)),
	);
});
