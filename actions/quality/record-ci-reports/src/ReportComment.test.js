import assert from "node:assert/strict";
import test from "node:test";
import { Protocol } from "./Protocol.js";
import { ReportComment } from "./ReportComment.js";

function fixture() {
	const sha = "a".repeat(40);
	const collection = {
		identity: {
			repository: "owner/repo",
			workflow: "owner/repo/.github/workflows/ci.yml",
			sha,
			attempt: 1,
		},
		checks: [],
	};
	const context = {
		runId: 10,
		repo: { owner: "owner", repo: "repo" },
		payload: {
			pull_request: {
				number: 2,
				head: { sha, repo: { full_name: "owner/repo" } },
			},
		},
	};
	const writes = [];
	const comments = [];
	const current = { state: "open", head: { sha } };
	const github = {
		paginate: async () => comments,
		rest: {
			pulls: { get: async () => ({ data: current }) },
			actions: {
				getWorkflowRun: async () => ({
					data: { created_at: "2026-11-28T10:00:00Z" },
				}),
			},
			issues: {
				listComments() {},
				updateComment: async (input) => {
					writes.push(input);
					return {
						data: {
							id: 20,
							html_url: "https://github.com/owner/repo/pull/2#issuecomment-20",
						},
					};
				},
				createComment: async (input) => {
					writes.push(input);
					return { data: { id: 21 } };
				},
			},
		},
	};
	const marker = `<!-- hoverkraft-ci-reports:v2:${Protocol.digest("owner/repo:owner/repo/.github/workflows/ci.yml:2")} -->`;
	const comment = new ReportComment({ github, context, collection });
	return { collection, context, writes, comments, current, marker, comment };
}

test("comment updates only the exact bot-owned marker and never a matching human comment", async () => {
	const f = fixture();
	f.comments.push({
		id: 19,
		user: { type: "User", login: "author" },
		body: `${f.marker}\ntext`,
	});
	const receipt = await f.comment.publish("Visible report");
	assert.equal(receipt.status, "published");
	assert.equal(f.writes[0].comment_id, undefined);
	assert.ok(f.writes[0].body.startsWith(f.marker));
});

test("an older run cannot overwrite a newer attempt's owned comment", async () => {
	const f = fixture();
	f.comments.push({
		id: 19,
		user: { type: "Bot", login: "github-actions[bot]" },
		body: `${f.marker}\n<!-- freshness:{"created":"2026-11-28T10:00:00Z","run":"10","attempt":2} -->\nNewer`,
	});
	const receipt = await f.comment.publish("Old result");
	assert.equal(receipt.status, "superseded");
	assert.equal(f.writes.length, 0);
});

test("changed PR heads and fork write limitations preserve the summary without a false comment success", async () => {
	const f = fixture();
	f.current.head.sha = "b".repeat(40);
	assert.equal((await f.comment.publish("Old result")).status, "superseded");
	f.context.payload.pull_request.head.repo.full_name = "fork/repo";
	assert.equal((await f.comment.publish("Explicit")).status, "failed");
	assert.equal(
		(await f.comment.publish("Fallback", { fallbackOnly: true })).status,
		"unavailable",
	);
	assert.equal(f.writes.length, 0);
});
