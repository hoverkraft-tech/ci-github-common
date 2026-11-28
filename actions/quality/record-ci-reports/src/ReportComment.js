import { Protocol } from "./Protocol.js";
import { Reporters } from "./Reporters.js";

/** A serialized update of one exact bot-owned marker, guarded against stale runs. */
export class ReportComment {
	constructor({ github, context, collection }) {
		Object.assign(this, { github, context, collection });
	}

	async publish(body, { fallbackOnly = false } = {}) {
		const dataset = Reporters.subject(this.collection);
		const receipt = (status, message, extra = {}) =>
			Reporters.receipt({
				dataset,
				reporter: "comment",
				status,
				message,
				...extra,
			});
		const pr = this.context.payload.pull_request;
		if (!pr)
			return receipt(
				"unavailable",
				"This event has no pull request. Read the Actions summary.",
			);
		if (
			pr.head.repo.full_name !==
			`${this.context.repo.owner}/${this.context.repo.repo}`
		)
			return receipt(
				fallbackOnly ? "unavailable" : "failed",
				"This fork run cannot write a PR comment. Read the Actions summary.",
			);
		try {
			const { data: current } = await this.github.rest.pulls.get({
				...this.context.repo,
				pull_number: pr.number,
			});
			if (current.state !== "open" || current.head.sha !== pr.head.sha)
				return receipt(
					"superseded",
					"PR head changed; this run will not overwrite its report.",
				);
			const key = Protocol.digest(
				`${this.collection.identity.repository}:${this.collection.identity.workflow}:${pr.number}`,
			);
			const marker = `<!-- hoverkraft-ci-reports:v2:${key} -->`;
			const comments = await this.github.paginate(
				this.github.rest.issues.listComments,
				{ ...this.context.repo, issue_number: pr.number, per_page: 100 },
			);
			const matching = comments.filter(
				(comment) =>
					comment.user?.type === "Bot" &&
					comment.user.login === "github-actions[bot]" &&
					comment.body?.startsWith(`${marker}\n`),
			);
			if (matching.length > 1)
				throw new Error(
					"Multiple owned report comments exist. Refusing to update an ambiguous comment.",
				);
			const existing = matching[0];
			const { data: run } = await this.github.rest.actions.getWorkflowRun({
				...this.context.repo,
				run_id: this.context.runId,
			});
			const freshness = {
				created: run.created_at,
				run: String(this.context.runId),
				attempt: this.collection.identity.attempt,
			};
			if (!freshness.created)
				throw new Error("GitHub omitted run freshness metadata.");
			if (existing) {
				const metadata = existing.body
					.split("\n")[1]
					?.match(/^<!-- freshness:(.+) -->$/);
				if (!metadata)
					throw new Error("Owned comment has no valid freshness metadata.");
				const previous = JSON.parse(metadata[1]);
				if (
					previous.created > freshness.created ||
					(previous.created === freshness.created &&
						(BigInt(previous.run) > BigInt(freshness.run) ||
							(previous.run === freshness.run &&
								previous.attempt > freshness.attempt)))
				)
					return receipt(
						"superseded",
						"A newer report already owns the PR comment.",
					);
			}
			// Recheck immediately before the write, after pagination and metadata reads.
			const latest = await this.github.rest.pulls.get({
				...this.context.repo,
				pull_number: pr.number,
			});
			if (latest.data.state !== "open" || latest.data.head.sha !== pr.head.sha)
				return receipt("superseded", "PR changed before the comment update.");
			const content = `${marker}\n<!-- freshness:${JSON.stringify(freshness)} -->\n${body}`;
			const { data } = existing
				? await this.github.rest.issues.updateComment({
						...this.context.repo,
						comment_id: existing.id,
						body: content,
					})
				: await this.github.rest.issues.createComment({
						...this.context.repo,
						issue_number: pr.number,
						body: content,
					});
			if (!data.id)
				throw new Error("GitHub did not acknowledge the comment write.");
			return receipt("published", "Consolidated PR comment updated.", {
				id: String(data.id),
				url: data.html_url,
			});
		} catch (error) {
			return receipt("failed", error.message);
		}
	}
}
