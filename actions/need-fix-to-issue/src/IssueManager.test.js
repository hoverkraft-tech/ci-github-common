import assert from "node:assert/strict";
import { test } from "node:test";
import { IssueManager } from "./IssueManager.js";

const repo = { owner: "example", repo: "project" };
const sourceUrl = `https://github.com/example/project/blob/${"a".repeat(40)}/src/app.js#L10`;

function issue(number, overrides = {}) {
	return {
		id: number + 1000,
		number,
		title: "Handle missing input",
		body: `${sourceUrl}\n\n\`\`\`js\n// fix the input\n\`\`\``,
		type: null,
		...overrides,
	};
}

function harness(
	issues,
	{ ownerType = "Organization", comments = [], update } = {},
) {
	const calls = { lists: [], updates: [], comments: [], warnings: [] };
	const api = {
		listForRepo() {},
		listComments() {},
		async update(parameters) {
			calls.updates.push(parameters);
			await update?.(parameters);
		},
		async createComment(parameters) {
			calls.comments.push(parameters);
		},
	};
	const github = {
		rest: {
			issues: api,
			users: {
				async getByUsername(parameters) {
					assert.deepEqual(parameters, { username: repo.owner });
					return { data: { type: ownerType } };
				},
			},
		},
		async paginate(endpoint, parameters) {
			calls.lists.push(parameters);
			if (endpoint === api.listForRepo) return issues;
			assert.equal(endpoint, api.listComments);
			return comments;
		},
	};
	const context = {
		repo,
		serverUrl: "https://github.com",
	};
	const core = {
		warning: (message) => calls.warnings.push(message),
		info() {},
	};
	return { manager: new IssueManager({ github, context, core }), calls };
}

test("paginates only open need-fix issues from oldest to newest", async () => {
	const { manager, calls } = harness([]);
	await manager.run();
	assert.deepEqual(calls.lists, [
		{
			...repo,
			state: "open",
			labels: "need-fix",
			sort: "created",
			direction: "asc",
			per_page: 100,
		},
	]);
	assert.deepEqual(calls.updates, []);
});

test("assigns Bug to untyped issues and preserves existing types and PRs", async () => {
	const { manager, calls } = harness([
		issue(1),
		issue(2, { type: { name: "Task" }, title: "Another task" }),
		issue(3, { pull_request: {} }),
	]);
	await manager.run();
	assert.deepEqual(calls.updates, [{ ...repo, issue_number: 1, type: "Bug" }]);
});

test("closes duplicates against the oldest open issue across commits and line changes", async () => {
	const { manager, calls } = harness([
		issue(1),
		issue(2, {
			body: sourceUrl
				.replace("a".repeat(40), "b".repeat(40))
				.replace("#L10", "#L50-L52"),
		}),
		issue(3),
	]);
	await manager.run();
	assert.deepEqual(
		calls.comments,
		[2, 3].map((number) => ({
			...repo,
			issue_number: number,
			body: "Duplicate of #1",
		})),
	);
	assert.deepEqual(
		calls.updates.filter(({ state }) => state),
		[2, 3].map((number) => ({
			...repo,
			issue_number: number,
			headers: { "X-GitHub-Api-Version": "2026-03-10" },
			state: "closed",
			state_reason: "duplicate",
			duplicate_issue_id: 1001,
		})),
	);
});

test("does not close issues with different files, titles, or unrecognized source links", async () => {
	const { manager, calls } = harness([
		issue(1),
		issue(2, { body: sourceUrl.replace("app.js", "other.js") }),
		issue(3, { title: "Handle empty input" }),
		issue(4, { body: null }),
		issue(5, { body: sourceUrl.replace("/example/", "/another/") }),
		issue(6, { body: sourceUrl.replace("a".repeat(40), "main") }),
	]);
	await manager.run();
	assert.equal(calls.updates.filter(({ state }) => state).length, 0);
	assert.deepEqual(calls.comments, []);
});

test("reruns leave typed originals unchanged and reuse an existing duplicate comment", async () => {
	const { manager, calls } = harness(
		[issue(1, { type: { name: "Bug" } }), issue(2, { type: { name: "Bug" } })],
		{ comments: [{ body: "Duplicate of #1" }] },
	);
	await manager.run();
	assert.deepEqual(calls.comments, []);
	assert.equal(calls.updates.length, 1);
	assert.equal(calls.updates[0].state, "closed");
	assert.equal(calls.updates[0].issue_number, 2);
});

test("personal repositories still close duplicates without assigning organization types", async () => {
	const { manager, calls } = harness([issue(1), issue(2)], {
		ownerType: "User",
	});
	await manager.run();
	assert.equal(calls.updates.length, 1);
	assert.equal(calls.updates[0].state, "closed");
});

test("an unavailable Bug type warns once and does not prevent duplicate cleanup", async () => {
	const { manager, calls } = harness([issue(1), issue(2), issue(3)], {
		update: async ({ type }) => {
			if (type)
				throw Object.assign(new Error("Validation failed"), {
					status: 422,
					response: { data: { errors: [{ field: "type", code: "invalid" }] } },
				});
		},
	});
	await manager.run();
	assert.equal(calls.warnings.length, 1);
	assert.equal(calls.updates.filter(({ type }) => type).length, 1);
	assert.equal(calls.updates.filter(({ state }) => state).length, 2);
});

test("permission, rate limit, server and unrelated validation errors fail the run", async () => {
	for (const status of [403, 429, 500, 422]) {
		const failure = Object.assign(new Error("API failure"), { status });
		const { manager } = harness([issue(1)], {
			update: async () => {
				throw failure;
			},
		});
		await assert.rejects(manager.run(), (error) => error === failure);
	}
});

test("a failed close can be retried without posting the duplicate comment twice", async () => {
	const comments = [];
	let failClose = true;
	const { manager, calls } = harness([issue(1), issue(2)], {
		comments,
		update: async ({ state }) => {
			if (state && failClose) {
				comments.push({ body: calls.comments[0].body });
				throw new Error("Temporary failure");
			}
		},
	});
	await assert.rejects(manager.run(), /Temporary failure/);
	failClose = false;
	await manager.run();
	assert.equal(calls.comments.length, 1);
	assert.equal(calls.updates.at(-1).state, "closed");
});
