import { randomUUID } from "node:crypto";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

/** Expected producer executions, created from the same configuration as the jobs. */
export class ReportPlan {
	constructor(identity) {
		this.identity = identity;
	}
	static parse(value) {
		return typeof value === "string" ? JSON.parse(value) : value;
	}

	create(producers) {
		const identity = this.identity;
		producers = ReportPlan.parse(producers);
		if (!Array.isArray(producers) || producers.length > 256) {
			throw new Error("producers must be an array with at most 256 entries.");
		}
		const plan = { version: 1, identity, group: randomUUID(), producers };
		this.validate(plan);
		return plan;
	}

	validate(value) {
		const identity = this.identity;
		const plan = ReportPlan.parse(value);
		if (
			plan?.version !== 1 ||
			!/^[a-f0-9-]{36}$/.test(plan.group) ||
			!Array.isArray(plan.producers) ||
			plan.producers.length > 256 ||
			Object.entries(identity).some(
				([key, value]) => plan.identity?.[key] !== value,
			)
		) {
			throw new Error(
				"Report plan belongs to a different repository, run or attempt, or has an unsupported schema.",
			);
		}
		const keys = new Set();
		for (const producer of plan.producers) {
			if (
				!producer ||
				!/^[\w.-]{1,100}$/.test(producer.key) ||
				keys.has(producer.key)
			) {
				throw new Error("Every planned producer needs a unique key.");
			}
			keys.add(producer.key);
			if (producer.job !== undefined && !/^[\w-]+$/.test(producer.job))
				throw new Error("An outer matrix producer job must be a job ID.");
			if (!["test", "lint"].includes(producer.type))
				throw new Error("Producer type must be test or lint.");
			const directory = producer.directory ?? ".";
			if (
				typeof directory !== "string" ||
				path.posix.isAbsolute(directory) ||
				directory.includes("\\") ||
				directory.split("/").includes("..")
			) {
				throw new Error(
					"Planned working directories must be repository-relative.",
				);
			}
			producer.directory = path.posix.normalize(directory);
			producer.label ??=
				producer.directory === "." ? "root" : producer.directory;
			if (
				!/^[\w.-][\w./-]{0,199}$/.test(producer.label) ||
				producer.label
					.split("/")
					.some((part) => !part || part === "." || part === "..")
			)
				throw new Error("Invalid report label.");
			producer.coverage ??= [];
			if (!Array.isArray(producer.coverage))
				throw new Error(
					"Producer coverage must be an array of report descriptions.",
				);
			const labels = new Set();
			for (const report of producer.coverage) {
				if (
					!report ||
					typeof report.file !== "string" ||
					!report.file ||
					path.posix.isAbsolute(report.file) ||
					report.file.includes("\\") ||
					report.file.split("/").includes("..") ||
					/[\r\n*?]/.test(report.file)
				) {
					throw new Error(
						"Coverage reports need explicit project-relative file paths.",
					);
				}
				report.label ??= producer.coverage.length === 1 ? producer.label : "";
				if (
					!/^[\w.-][\w./-]{0,199}$/.test(report.label) ||
					report.label
						.split("/")
						.some((part) => !part || part === "." || part === "..") ||
					labels.has(report.label)
				)
					throw new Error(
						"Every coverage component needs a unique stable label.",
					);
				if (
					typeof report.language !== "string" ||
					!/^[A-Za-z][A-Za-z0-9 #+.-]{0,79}$/.test(report.language)
				)
					throw new Error("Coverage needs a Linguist language name.");
				labels.add(report.label);
			}
		}
		return plan;
	}

	static selections(plan) {
		const selections = Object.fromEntries(
			plan.producers.map((producer) => [
				producer.key,
				{ ...plan, producers: [producer] },
			]),
		);
		// Single-kind invocations can keep an outer matrix's unique execution key.
		for (const type of ["lint", "test"]) {
			const producers = plan.producers.filter(
				(producer) => producer.type === type,
			);
			if (producers.length === 1 && !selections[type])
				selections[type] = { ...plan, producers };
		}
		return selections;
	}

	fromJobs(jobs) {
		const plans = new Map();
		for (const [job, result] of Object.entries(jobs)) {
			if (
				!/^[\w-]+$/.test(job) ||
				!["success", "failure", "cancelled", "skipped", "abandoned"].includes(
					result?.result,
				)
			) {
				throw new Error("job-results must contain completed job results.");
			}
			const value = result.outputs?.["report-plan"];
			if (!value) continue;
			const forwarded = ReportPlan.parse(value);
			const inventory = Array.isArray(forwarded) ? forwarded : [forwarded];
			for (const entry of inventory) {
				const plan = this.validate(entry);
				for (const producer of plan.producers) {
					const id = `${plan.group}-${producer.key}`;
					const owner = producer.job || job;
					if (!jobs[owner])
						throw new Error(
							`Planned producer job ${owner} is absent from job-results.`,
						);
					const expected = {
						plan: { ...plan, producers: [producer] },
						producer,
						job: owner,
						result: jobs[owner].result,
					};
					if (plans.has(id)) {
						// An explicit outer inventory and the matrix's last output can overlap.
						// Only an identical definition tied to the same outer job is redundant.
						if (producer.job && isDeepStrictEqual(plans.get(id), expected))
							continue;
						throw new Error(
							`Duplicate report plan for ${producer.label}. Forward a matrix's complete plan once, from its configuration job.`,
						);
					}
					plans.set(id, expected);
				}
			}
		}
		return plans;
	}
}
