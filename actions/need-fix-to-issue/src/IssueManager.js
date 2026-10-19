export class IssueManager {
	constructor({ github, context, core }) {
		this.github = github;
		this.context = context;
		this.core = core;
	}

	async run() {
		const issues = await this.github.paginate(
			this.github.rest.issues.listForRepo,
			{
				...this.context.repo,
				state: "open",
				labels: "need-fix",
				sort: "created",
				direction: "asc",
				per_page: 100,
			},
		);
		if (issues.length === 0) return;
		const { data: owner } = await this.github.rest.users.getByUsername({
			username: this.context.repo.owner,
		});
		this.canAssignType = owner.type === "Organization";
		const originals = new Map();
		for (const issue of issues) {
			if (issue.pull_request) continue;
			await this.assignBugType(issue);
			const key = this.duplicateKey(issue);
			if (!key) continue;
			const original = originals.get(key);
			if (original) {
				await this.closeDuplicate(issue, original);
			} else {
				originals.set(key, issue);
			}
		}
	}

	duplicateKey(issue) {
		const { owner, repo } = this.context.repo;
		const prefix = `${this.context.serverUrl}/${owner}/${repo}/blob/`;
		for (const line of (issue.body ?? "").split("\n")) {
			if (!line.startsWith(prefix)) continue;
			const source = line
				.slice(prefix.length)
				.trim()
				.match(/^[a-f\d]{40}\/(.+)#L\d+(?:-L\d+)?$/i);
			if (source) return JSON.stringify([issue.title, source[1]]);
		}
		return null;
	}

	async assignBugType(issue) {
		if (!this.canAssignType || issue.type) return;
		try {
			await this.github.rest.issues.update({
				...this.context.repo,
				issue_number: issue.number,
				type: "Bug",
			});
		} catch (error) {
			const invalidType =
				error.status === 422 &&
				error.response?.data?.errors?.some(({ field }) => field === "type");
			if (!invalidType) throw error;
			this.canAssignType = false;
			this.core.warning(
				'The "Bug" issue type is unavailable. Enable it in the organization to categorize generated issues.',
			);
		}
	}

	async closeDuplicate(issue, original) {
		const parameters = { ...this.context.repo, issue_number: issue.number };
		const body = `Duplicate of #${original.number}`;
		const comments = await this.github.paginate(
			this.github.rest.issues.listComments,
			{ ...parameters, per_page: 100 },
		);
		if (!comments.some((comment) => comment.body === body)) {
			await this.github.rest.issues.createComment({ ...parameters, body });
		}
		await this.github.rest.issues.update({
			...parameters,
			headers: { "X-GitHub-Api-Version": "2026-03-10" },
			state: "closed",
			state_reason: "duplicate",
			duplicate_issue_id: original.id,
		});
		this.core.info(
			`Closed #${issue.number} as a duplicate of #${original.number}.`,
		);
	}
}
