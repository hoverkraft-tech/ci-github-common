import { Protocol } from "./Protocol.js";

export const Reporters = {
	selections: {
		lint: {
			allowed: ["annotations", "comment", "code-scanning"],
			default: "annotations",
		},
		test: { allowed: ["annotations", "comment"], default: "annotations" },
		coverage: {
			allowed: ["auto", "github", "codecov", "coveralls", "comment"],
			default: "auto",
		},
	},

	parse(inputs = {}) {
		return Object.fromEntries(
			Object.entries(Reporters.selections).map(([kind, config]) => {
				const value = inputs[kind] ?? config.default;
				if (typeof value !== "string")
					throw new Error(`${kind} reporters must be newline-separated text.`);
				const selected = [
					...new Set(
						value
							.split(/\r?\n/)
							.map((line) => line.trim())
							.filter(Boolean),
					),
				];
				for (const reporter of selected)
					if (!config.allowed.includes(reporter))
						throw new Error(
							`Unknown ${kind} reporter ${reporter}. Allowed: ${config.allowed.join(", ")}.`,
						);
				return [kind, selected];
			}),
		);
	},

	receipt({ dataset, reporter, status, message = "", id, url }) {
		if (
			![
				"published",
				"submitted",
				"unavailable",
				"superseded",
				"failed",
			].includes(status)
		)
			throw new Error("Invalid publication outcome.");
		return {
			dataset: dataset.id,
			source: dataset.source.sha,
			digest: dataset.digest,
			reporter,
			status,
			message,
			...(id ? { id } : {}),
			...(url ? { url } : {}),
		};
	},

	subject(collection, kind = "run") {
		return {
			id: kind,
			source: { sha: collection.identity.sha },
			digest: Protocol.digest(
				JSON.stringify(
					kind === "run"
						? collection
						: collection.checks.filter((check) =>
								check.check.reports.some((report) => report.kind === kind),
							),
				),
			),
		};
	},

	expected(collection, receipts, { includeComment = true } = {}) {
		const expected = [];
		for (const kind of ["test", "lint"]) {
			if (
				!collection.checks.some((check) =>
					check.check.reports.some((report) => report.kind === kind),
				)
			)
				continue;
			for (const reporter of collection.reporters[kind].filter(
				(value) => value !== "comment",
			))
				expected.push({
					dataset: Reporters.subject(collection, kind),
					reporter,
				});
		}
		for (const dataset of collection.datasets.filter(
			(item) => item.role === "primary",
		)) {
			for (const reporter of ["github", "codecov", "coveralls"]) {
				if (
					collection.reporters.coverage.includes(reporter) ||
					(reporter === "github" &&
						collection.reporters.coverage.includes("auto"))
				)
					expected.push({ dataset, reporter });
			}
		}
		if (
			includeComment &&
			(Object.values(collection.reporters).some((values) =>
				values.includes("comment"),
			) ||
				receipts.some((receipt) => receipt.fallback === "comment"))
		)
			expected.push({
				dataset: Reporters.subject(collection),
				reporter: "comment",
			});
		if (
			collection.reporters.coverage.includes("coveralls") &&
			collection.datasets.some((item) => item.role === "primary")
		)
			expected.push({
				dataset: Reporters.subject(collection),
				reporter: "coveralls-finish",
			});
		return expected;
	},

	complete(collection, receipts, jobs = {}, options = {}) {
		const errors = [...collection.errors];
		for (const [name, job] of Object.entries(collection.jobs))
			if (["failure", "cancelled"].includes(job.result))
				errors.push(`${name}: ${job.result}`);
		for (const check of collection.checks) {
			if (check.result?.outcome !== "success")
				errors.push(
					`${check.check.name}: ${check.result?.outcome || "missing result"}`,
				);
			errors.push(
				...(check.result?.errors || []).map(
					(error) => `${check.check.name}: ${error}`,
				),
			);
			if (
				check.result?.assets.some(
					(asset) =>
						asset.data?.tests?.some((test) =>
							["failed", "error"].includes(test.status),
						) ||
						asset.data?.lintIssues?.some((issue) => issue.severity === "error"),
				)
			)
				errors.push(
					`${check.check.name}: native reports contain failing tests or lint errors.`,
				);
		}
		for (const receipt of receipts)
			if (["failed", "superseded"].includes(receipt.status))
				errors.push(
					`${receipt.reporter}: ${receipt.message || receipt.status}`,
				);
		for (const { dataset, reporter } of Reporters.expected(
			collection,
			receipts,
			options,
		)) {
			const matching = receipts.filter(
				(receipt) =>
					receipt.dataset === dataset.id &&
					receipt.reporter === reporter &&
					receipt.source === dataset.source.sha &&
					receipt.digest === dataset.digest,
			);
			if (matching.length !== 1) {
				errors.push(
					`${reporter} / ${dataset.label || dataset.id}: expected one publication receipt, received ${matching.length}.`,
				);
				continue;
			}
			const receipt = matching[0];
			if (
				receipt.status === "submitted" &&
				!["codecov", "coveralls", "coveralls-finish"].includes(reporter)
			)
				errors.push(
					`${reporter}: submission alone does not confirm publication.`,
				);
			if (
				receipt.status === "unavailable" &&
				reporter !== "comment" &&
				!(
					reporter === "github" &&
					collection.reporters.coverage.includes("auto") &&
					!collection.reporters.coverage.includes("github")
				)
			)
				errors.push(`${reporter}: required publication is unavailable.`);
			if (
				reporter === "github" &&
				receipt.status === "published" &&
				!receipt.id
			)
				errors.push("GitHub publication has no processed report ID.");
		}
		for (const [name, job] of Object.entries(jobs))
			if (["failure", "cancelled"].includes(job.result))
				errors.push(`${name}: ${job.result}`);
		return [...new Set(errors)];
	},
};
