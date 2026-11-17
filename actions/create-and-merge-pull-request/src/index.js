export async function run({
	github,
	context,
	core,
	exec,
	env = process.env,
	sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
}) {
	const maxAttempts = 10;
	const requiredWorkflowsError = "Required workflow";
	const repository = `${context.repo.owner}/${context.repo.repo}`;
	const mergeMethod = (env.MERGE_METHOD ?? "rebase").trim();
	const mergeCommitTitle = (env.PULL_REQUEST_TITLE ?? "").trim();
	const mergeCommitMessage = env.PULL_REQUEST_COMMIT_MESSAGE ?? "";
	const expectedHeadSha = (env.PULL_REQUEST_HEAD_SHA ?? "").trim();
	const bypassBranchProtection = env.BYPASS_BRANCH_PROTECTION ?? "true";
	const mergeMethodFlags = {
		merge: "--merge",
		rebase: "--rebase",
		squash: "--squash",
	};
	const getRetryDelayMs = (attempt) => Math.min(1000 * 2 ** attempt, 10000);

	if (!(mergeMethod in mergeMethodFlags)) {
		throw new Error(
			`Invalid merge method: ${mergeMethod}. Expected one of: ${Object.keys(mergeMethodFlags).join(", ")}`,
		);
	}

	if (!/^[a-f0-9]{40}$/.test(expectedHeadSha)) {
		throw new Error(
			"A valid pull request head SHA from the creation step is required.",
		);
	}
	if (!["true", "false"].includes(bypassBranchProtection)) {
		throw new Error("bypass-branch-protection must be true or false.");
	}

	const waitFor = async ({
		run,
		isComplete,
		shouldRetry = () => true,
		onAttempt = () => {},
		getRetryMessage,
		getFailureMessage,
		getTimeoutMessage,
	}) => {
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const result = await run();

			onAttempt(result);

			if (isComplete(result)) {
				return result;
			}

			if (!shouldRetry(result)) {
				throw new Error(getFailureMessage(result));
			}

			const retryDelayMs = getRetryDelayMs(attempt);
			core.debug(getRetryMessage(result, retryDelayMs));
			await sleep(retryDelayMs);
		}

		throw new Error(getTimeoutMessage());
	};

	const parsePullRequestNumber = (pullNumberRaw) => {
		if (!/^[0-9]+$/.test(pullNumberRaw)) {
			throw new Error(`Invalid pull request number: ${pullNumberRaw}`);
		}

		return Number.parseInt(pullNumberRaw, 10);
	};

	const getPullRequest = async (pullNumber) => {
		const { data: pullRequest } = await github.rest.pulls.get({
			owner: context.repo.owner,
			repo: context.repo.repo,
			pull_number: pullNumber,
		});

		return pullRequest;
	};

	const waitForMergeablePullRequest = (pullNumber) =>
		waitFor({
			run: async () => {
				const pullRequest = await getPullRequest(pullNumber);
				if (pullRequest.head?.sha !== expectedHeadSha) {
					throw new Error(
						`Pull request #${pullNumber} head changed after creation; refusing to merge.`,
					);
				}
				return pullRequest;
			},
			isComplete: (pullRequest) => pullRequest.mergeable === true,
			onAttempt: (pullRequest) => {
				if (pullRequest.mergeable !== true) {
					core.debug(
						`Pull request is not mergeable, mergeable_state: ${pullRequest.mergeable_state}`,
					);
				}
			},
			getRetryMessage: (_pullRequest, retryDelayMs) =>
				`Retrying mergeability check in ${retryDelayMs}ms...`,
			getFailureMessage: () =>
				`Pull request #${pullNumber} cannot be retried because it is not mergeable.`,
			getTimeoutMessage: () =>
				`Pull request #${pullNumber} is not mergeable after ${maxAttempts} attempts`,
		});

	const getMergeArguments = (pullNumber) => {
		const args = [
			"pr",
			"merge",
			"-R",
			repository,
			mergeMethodFlags[mergeMethod],
			"--match-head-commit",
			expectedHeadSha,
			String(pullNumber),
		];

		if (bypassBranchProtection === "true") {
			args.push("--admin");
		}

		if (mergeMethod !== "rebase" && mergeCommitTitle) {
			args.push("--subject", mergeCommitTitle);
		}

		if (mergeMethod !== "rebase" && mergeCommitMessage.trim()) {
			args.push("--body", mergeCommitMessage);
		}

		return args;
	};

	const mergePullRequest = async (pullNumber) => {
		core.debug(
			`Merging pull request #${pullNumber} for repository ${repository} with method ${mergeMethod}...`,
		);

		const { exitCode, stdout, stderr } = await exec.getExecOutput(
			"gh",
			getMergeArguments(pullNumber),
			{
				env: env,
				ignoreReturnCode: true,
				silent: true,
			},
		);

		return {
			mergeExitCode: exitCode,
			mergeOutputs: [stdout, stderr].filter(Boolean).join("\n").trim(),
		};
	};

	const verifyMergedPullRequest = async (pullNumber, mergeOutputs) => {
		const pullRequest = await waitFor({
			run: () => getPullRequest(pullNumber),
			isComplete: (currentPullRequest) =>
				Boolean(
					currentPullRequest.merged &&
						currentPullRequest.base.ref &&
						currentPullRequest.merge_commit_sha,
				),
			getRetryMessage: (_pullRequest, retryDelayMs) =>
				`Pull request merge has not been reflected by the REST API yet, retrying in ${retryDelayMs}ms...`,
			getFailureMessage: () =>
				`Pull request merge verification stopped before completion: ${mergeOutputs}`,
			getTimeoutMessage: () =>
				`Pull request merge succeeded but timed out while waiting for REST API verification: ${mergeOutputs}`,
		});

		core.setOutput("merged-ref", `refs/heads/${pullRequest.base.ref}`);
		core.setOutput("merged-sha", pullRequest.merge_commit_sha);
	};

	const pullNumber = parsePullRequestNumber(env.PULL_REQUEST_NUMBER ?? "");

	await waitForMergeablePullRequest(pullNumber);

	const { mergeOutputs } = await waitFor({
		run: () => mergePullRequest(pullNumber),
		isComplete: ({ mergeExitCode }) => mergeExitCode === 0,
		shouldRetry: ({ mergeOutputs }) =>
			mergeOutputs.includes(requiredWorkflowsError),
		onAttempt: ({ mergeExitCode, mergeOutputs }) => {
			core.debug(`Merge outputs: ${mergeOutputs}`);
			core.debug(`Merge exit code: ${mergeExitCode}`);
		},
		getRetryMessage: (_result, retryDelayMs) =>
			`Pull request is not mergeable yet because some of required workflow check issues, retrying in ${retryDelayMs}ms...`,
		getFailureMessage: ({ mergeOutputs }) =>
			`Failed to merge pull request: ${mergeOutputs}`,
		getTimeoutMessage: () =>
			`Failed to merge pull request after ${maxAttempts} attempts`,
	});

	await verifyMergedPullRequest(pullNumber, mergeOutputs);
}
