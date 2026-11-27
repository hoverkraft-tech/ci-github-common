/** Bind reports to actual executions, including copied successful jobs in reruns. */
export class ExecutionIdentity {
	constructor({
		github,
		context,
		attempt,
		runnerName,
		sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
	}) {
		this.github = github;
		this.context = context;
		this.attempt = Number(attempt);
		this.runnerName = runnerName;
		this.sleep = sleep;
	}

	async jobs(attempt = this.attempt) {
		return this.github.paginate(
			this.github.rest.actions.listJobsForWorkflowRunAttempt,
			{
				...this.context.repo,
				run_id: this.context.runId,
				attempt_number: attempt,
				per_page: 100,
			},
		);
	}

	static sameExecution(left, right) {
		return (
			left.name === right.name &&
			left.runner_id === right.runner_id &&
			left.runner_name === right.runner_name &&
			left.started_at === right.started_at
		);
	}

	async current() {
		if (
			!this.runnerName ||
			!Number.isSafeInteger(this.attempt) ||
			this.attempt < 1
		)
			throw new Error(
				"Recording requires the GitHub runner name and run attempt.",
			);
		for (const delay of [0, 1000, 2000, 4000]) {
			if (delay) await this.sleep(delay);
			const candidates = (await this.jobs()).filter(
				(job) =>
					job.status === "in_progress" && job.runner_name === this.runnerName,
			);
			if (candidates.length > 1)
				throw new Error(
					"Ambiguous runner execution; refusing to associate reports by display name.",
				);
			if (candidates.length === 1) {
				const job = candidates[0];
				if (!job.runner_id || !job.started_at)
					throw new Error("GitHub omitted runner execution metadata.");
				return {
					repository: `${this.context.repo.owner}/${this.context.repo.repo}`,
					repositoryId: String(this.context.payload.repository.id),
					runId: String(this.context.runId),
					attempt: this.attempt,
					job: {
						id: job.id,
						name: job.name,
						runner_id: job.runner_id,
						runner_name: job.runner_name,
						started_at: job.started_at,
						html_url: job.html_url,
					},
				};
			}
		}
		throw new Error(
			"Could not identify the active GitHub job. Check actions: read permission and runner metadata.",
		);
	}

	async select(registrations) {
		const latest = await this.jobs();
		const originals = new Map();
		for (const attempt of new Set(
			registrations.map((record) => record.execution.attempt),
		)) {
			if (
				!Number.isSafeInteger(attempt) ||
				attempt < 1 ||
				attempt > this.attempt
			)
				throw new Error("Invalid recording attempt.");
			originals.set(attempt, await this.jobs(attempt));
		}
		for (const record of registrations) {
			const original = originals
				.get(record.execution.attempt)
				.find((job) => job.id === record.execution.job.id);
			if (
				!original ||
				!ExecutionIdentity.sameExecution(original, record.execution.job)
			)
				throw new Error(
					"Recording execution disagrees with GitHub's original job.",
				);
		}
		const names = new Set(
			registrations.map((record) => record.execution.job.name),
		);
		const selected = [];
		const errors = [];
		for (const job of latest.filter((item) => names.has(item.name))) {
			if (job.status !== "completed")
				throw new Error(
					"A registered producer is still active. ci-reports must wait for every producer.",
				);
			const matches = registrations.filter((record) =>
				ExecutionIdentity.sameExecution(record.execution.job, job),
			);
			if (!matches.length) {
				errors.push(
					`${job.name}: execution changed without a new registration. Rerun this producer.`,
				);
				continue;
			}
			if (
				latest.filter((other) => ExecutionIdentity.sameExecution(other, job))
					.length !== 1
			)
				throw new Error("Ambiguous execution metadata in the current attempt.");
			for (const registration of matches) selected.push({ registration, job });
		}
		for (const name of names)
			if (!latest.some((job) => job.name === name))
				errors.push(`${name}: producer is absent from the current attempt.`);
		return { selected, errors };
	}
}
