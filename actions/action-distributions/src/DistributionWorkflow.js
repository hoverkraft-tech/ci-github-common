import assert from "node:assert/strict";
import { parse } from "yaml";

class DistributionWorkflow {
	constructor(github, context) {
		this.github = github;
		this.context = context;
	}

	async validate(run) {
		const { repo, runId, sha } = this.context;
		assert(
			/^[a-f0-9]{40}$/.test(sha),
			"Expected trusted default-branch revision",
		);
		const { data: writer } = await this.github.rest.actions.getWorkflowRun({
			...repo,
			run_id: runId,
		});
		assert.equal(writer.event, "workflow_run", "Expected workflow_run writer");
		assert.equal(writer.head_sha, sha, "Unexpected writer revision");
		const workflows = await this.definitions(sha);
		const configuration = workflows.find(({ path }) => path === writer.path);
		const filter = configuration?.definition.on?.workflow_run?.workflows;
		const names = typeof filter === "string" ? [filter] : filter;
		assert(
			Array.isArray(names) &&
				names.length === 1 &&
				typeof names[0] === "string" &&
				names[0].trim() &&
				!/[*!?+[\]{}\\]/.test(names[0]),
			"Writer workflow_run.workflows must select one exact builder name",
		);
		const matches = workflows.filter(
			({ path, definition }) => (definition.name ?? path) === names[0],
		);
		assert.equal(
			matches.length,
			1,
			"Builder name must resolve to exactly one trusted workflow",
		);
		const expected = matches[0];
		const trigger = expected.definition.on;
		assert(
			trigger === "pull_request" ||
				(Array.isArray(trigger)
					? trigger.includes("pull_request")
					: trigger && Object.hasOwn(trigger, "pull_request")),
			"Builder must declare a pull_request trigger",
		);
		const { data: workflow } = await this.github.rest.actions.getWorkflow({
			...repo,
			workflow_id: run.workflow_id,
		});
		assert.equal(workflow.path, expected.path, "Unexpected builder workflow");
		assert.equal(run.path, expected.path, "Unexpected builder run path");
	}

	async definitions(sha) {
		// Read every name from the trusted snapshot: a PR can rename its workflow.
		const { repository } = await this.github.graphql(
			`query($owner: String!, $repo: String!, $expression: String!) {
				repository(owner: $owner, name: $repo) {
					object(expression: $expression) {
						... on Tree { entries { name mode object { ... on Blob { text isTruncated } } } }
					}
				}
			}`,
			{ ...this.context.repo, expression: `${sha}:.github/workflows` },
		);
		assert(
			Array.isArray(repository?.object?.entries),
			"Missing trusted workflow directory",
		);
		return repository.object.entries
			.filter(({ name }) => /\.ya?ml$/.test(name))
			.map((entry) => {
				assert(
					(entry.mode === 0o100644 || entry.mode === 0o100755) &&
						entry.object?.isTruncated === false &&
						typeof entry.object.text === "string",
					"Expected complete regular workflow file",
				);
				const definition = parse(entry.object.text);
				assert(
					definition && typeof definition === "object",
					"Expected workflow mapping",
				);
				return { path: `.github/workflows/${entry.name}`, definition };
			});
	}
}

export { DistributionWorkflow };
