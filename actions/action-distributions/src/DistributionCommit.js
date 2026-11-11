class DistributionCommit {
	constructor(github, repo) {
		this.github = github;
		this.repo = repo;
	}

	async create({ branch, head, message, fileChanges }) {
		const tree = [];
		for (const file of fileChanges.additions) {
			const { data } = await this.github.rest.git.createBlob({
				...this.repo,
				content: file.contents,
				encoding: "base64",
			});
			tree.push({
				path: file.path,
				mode: "100644",
				type: "blob",
				sha: data.sha,
			});
		}
		for (const file of fileChanges.deletions)
			tree.push({ path: file.path, mode: "100644", type: "blob", sha: null });
		const { data: parent } = await this.github.rest.git.getCommit({
			...this.repo,
			commit_sha: head,
		});
		const { data: createdTree } = await this.github.rest.git.createTree({
			...this.repo,
			base_tree: parent.tree.sha,
			tree,
		});
		const { data: commit } = await this.github.rest.git.createCommit({
			...this.repo,
			message: `${message.headline}\n\n${message.body}`,
			tree: createdTree.sha,
			parents: [head],
		});
		const { repository } = await this.github.graphql(
			"query($owner: String!, $repo: String!) { repository(owner: $owner, name: $repo) { id } }",
			this.repo,
		);
		// beforeOid is a compare-and-swap guard, including branch rewinds and rebases.
		await this.github.graphql(
			"mutation($input: UpdateRefsInput!) { updateRefs(input: $input) { clientMutationId } }",
			{
				input: {
					repositoryId: repository.id,
					refUpdates: [
						{
							name: `refs/heads/${branch}`,
							beforeOid: head,
							afterOid: commit.sha,
							force: false,
						},
					],
				},
			},
		);
	}
}

export { DistributionCommit };
