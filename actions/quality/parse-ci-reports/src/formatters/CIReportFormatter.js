/** One normalized model, a compact selected comment and a complete run summary. */
export class ReportRenderer {
	constructor({ collection, receipts = [], errors = [], runUrl, sourceUrl }) {
		Object.assign(this, { collection, receipts, errors, runUrl, sourceUrl });
	}

	static text(value, limit = 400) {
		return String(value ?? "")
			.slice(0, limit)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/@/g, "&#64;")
			.replace(/[\r\n]+/g, " ")
			.replace(/([\\`*_[\]|])/g, "\\$1");
	}

	static table(headers, rows, limit = 30) {
		const visible = rows.slice(0, limit);
		const table = [
			`| ${headers.join(" | ")} |`,
			`| ${headers.map(() => "---").join(" | ")} |`,
			...visible.map((row) => `| ${row.join(" | ")} |`),
		];
		if (rows.length > visible.length)
			table.push(
				`\nShowing ${visible.length} of ${rows.length} rows. Full details are retained in the report artifacts.`,
			);
		return table.join("\n");
	}

	static details(label, body) {
		return `<details>\n<summary>${ReportRenderer.text(label, 250)}</summary>\n\n${body}\n\n</details>`;
	}

	link(label, url) {
		if (!/^https:\/\//.test(url || "")) return ReportRenderer.text(label);
		return `[${ReportRenderer.text(label)}](${url.replace(/[()\s]/g, encodeURIComponent)})`;
	}

	source(file, sha, line) {
		if (!file) return "See job logs";
		const url = `${this.sourceUrl}/${sha}/${file.split("/").map(encodeURIComponent).join("/")}${Number.isSafeInteger(line) && line > 0 ? `#L${line}` : ""}`;
		return this.link(`${file}${line ? `:${line}` : ""}`, url);
	}

	findings() {
		const tests = [];
		const lint = new Map();
		for (const check of this.collection.checks) {
			for (const asset of check.result?.assets || []) {
				for (const test of asset.data?.tests || [])
					tests.push({
						...test,
						check,
						owner: asset.selector.owner || "collector",
					});
				for (const issue of asset.data?.lintIssues || []) {
					const key = JSON.stringify([
						check.check.project,
						check.source.sha,
						issue.source || asset.format,
						issue.rule,
						issue.file,
						issue.line,
						issue.column,
						issue.message,
					]);
					if (!lint.has(key))
						lint.set(key, {
							...issue,
							check,
							owner: asset.selector.owner || "collector",
						});
				}
			}
		}
		return { tests, lint: [...lint.values()] };
	}

	selected(comment) {
		if (!comment) return { test: true, lint: true, coverage: true };
		const selections = Object.fromEntries(
			Object.entries(this.collection.reporters).map(([kind, values]) => [
				kind,
				values.includes("comment"),
			]),
		);
		if (
			this.receipts.some(
				(receipt) =>
					receipt.reporter === "github" && receipt.fallback === "comment",
			)
		)
			selections.coverage = true;
		return selections;
	}

	tests(tests, comment) {
		if (!tests.length) return "";
		const failed = tests.filter((item) =>
			["failed", "error"].includes(item.status),
		);
		const passed = tests.filter((item) => item.status === "passed").length;
		const skipped = tests.filter((item) => item.status === "skipped").length;
		const projects = new Map();
		for (const item of tests) {
			const key = item.check.check.project;
			if (!projects.has(key))
				projects.set(key, { passed: 0, failed: 0, skipped: 0 });
			projects.get(key)[
				["failed", "error"].includes(item.status) ? "failed" : item.status
			]++;
		}
		const body = [
			ReportRenderer.table(
				["Project", "Executions"],
				[...projects].map(([name, counts]) => [
					ReportRenderer.text(name),
					`${counts.passed} passed, ${counts.failed} failed, ${counts.skipped} skipped`,
				]),
			),
			"Counts include every runtime execution, not globally unique test cases.",
		];
		const cases = new Map();
		for (const item of failed) {
			const key = JSON.stringify([
				item.check.check.project,
				item.check.source.sha,
				item.suite,
				item.name,
				item.file,
				item.message,
			]);
			if (!cases.has(key)) cases.set(key, { item, executions: [] });
			cases
				.get(key)
				.executions.push(
					this.link(
						Object.values(item.check.check.variant).join(" / ") ||
							item.check.check.name,
						item.check.job.html_url,
					),
				);
		}
		if (cases.size)
			body.push(
				ReportRenderer.table(
					["Failing case", "Executions", "Diagnostic"],
					[...cases.values()].map(({ item, executions }) => [
						ReportRenderer.text(`${item.suite} / ${item.name}`),
						[...new Set(executions)].join(", "),
						ReportRenderer.text(item.message),
					]),
				),
			);
		if (!comment)
			body.push(
				ReportRenderer.table(
					["Check / runtime", "Result", "Evidence"],
					this.collection.checks
						.filter((check) =>
							check.check.reports.some((report) => report.kind === "test"),
						)
						.map((check) => [
							ReportRenderer.text(
								`${check.check.name} / ${Object.values(check.check.variant).join(" / ")}`,
							),
							ReportRenderer.text(check.result?.outcome || "Missing result"),
							this.link("Job and artifacts", check.job.html_url),
						]),
					100,
				),
			);
		return ReportRenderer.details(
			`Tests: ${passed} passed, ${failed.length} failed${skipped ? `, ${skipped} skipped` : ""} executions`,
			body.join("\n\n"),
		);
	}

	lint(issues) {
		const checks = this.collection.checks.filter((check) =>
			check.check.reports.some((report) => report.kind === "lint"),
		);
		if (!checks.length) return "";
		const errors = issues.filter((issue) => issue.severity === "error").length;
		const warnings = issues.filter(
			(issue) => issue.severity === "warning",
		).length;
		const body = [
			ReportRenderer.table(
				["Check", "Result", "Evidence"],
				checks.map((check) => [
					ReportRenderer.text(check.check.name),
					ReportRenderer.text(check.result?.outcome || "Missing result"),
					this.link("Lint job", check.job.html_url),
				]),
			),
		];
		for (const check of checks)
			for (const asset of check.result?.assets || [])
				if (asset.data?.summary)
					body.push(
						`**${ReportRenderer.text(check.check.name)} native summary**\n\n${asset.data.summary
							.split("\n")
							.filter((line) => line.startsWith("|"))
							.slice(0, 80)
							.map(
								(line) =>
									`| ${line
										.split("|")
										.slice(1, -1)
										.map((cell) => ReportRenderer.text(cell.trim(), 300))
										.join(" | ")} |`,
							)
							.join("\n")}`,
					);
		if (issues.length)
			body.push(
				ReportRenderer.table(
					["Location", "Rule", "Finding"],
					issues.map((issue) => [
						this.source(issue.file, issue.check.source.sha, issue.line),
						ReportRenderer.text(issue.rule),
						ReportRenderer.text(`${issue.severity}: ${issue.message}`),
					]),
				),
			);
		const failed = checks.filter(
			(check) => check.result?.outcome === "failure",
		).length;
		const incomplete = checks.filter(
			(check) => !check.result || check.result.errors.length,
		).length;
		const status = [
			`${checks.length} ${checks.length === 1 ? "check" : "checks"}`,
			...(failed ? [`${failed} failed`] : []),
			...(incomplete ? [`${incomplete} incomplete`] : []),
			...(issues.length ? [`${errors} errors`, `${warnings} warnings`] : []),
		];
		if (!failed && !incomplete && !errors) status.push("passed");
		return ReportRenderer.details(
			`Lint: ${status.join(", ")}`,
			body.join("\n\n"),
		);
	}

	coverage(comment) {
		const datasets = this.collection.datasets;
		if (!datasets.length) return "";
		const measurements = datasets.map((dataset) => {
			const coverage = dataset.errors.length
				? null
				: dataset.assets[0]?.data?.coverage;
			const lines = coverage?.lines;
			return {
				dataset,
				coverage,
				label: `${dataset.label}: ${lines ? `${lines.percentage.toFixed(1)}%` : "unknown"}`,
			};
		});
		const title =
			measurements.length <= 2
				? measurements.map(({ label }) => label).join("; ")
				: `${measurements.length} datasets; ${measurements.filter(({ coverage }) => !coverage).length} unavailable`;
		const body = [
			ReportRenderer.table(
				["Dataset", "Lines", "Change"],
				measurements.map(({ dataset, coverage }) => {
					const base = dataset.baseline?.coverage?.lines;
					const delta =
						coverage && base
							? coverage.lines.percentage - base.percentage
							: null;
					return [
						ReportRenderer.text(dataset.label),
						coverage
							? `${coverage.lines.percentage.toFixed(1)}% (${coverage.lines.covered}/${coverage.lines.total})`
							: "**Unknown: missing or invalid report**",
						delta === null
							? ReportRenderer.text(
									dataset.baseline?.reason || "No comparable baseline",
								)
							: this.link(
									`${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pp vs ${dataset.baseline.sha.slice(0, 7)}`,
									dataset.baseline.url,
								),
					];
				}),
			),
			"Measurements remain separate by dataset. No coverage gate is configured by this reporting workflow. Changes require a comparable base-commit measurement.",
		];
		if (!comment)
			body.push(
				ReportRenderer.table(
					["Dataset", "Native metrics", "Tested source"],
					measurements.map(({ dataset, coverage }) => [
						ReportRenderer.text(dataset.label),
						["branches", "functions", "statements"]
							.map(
								(metric) =>
									`${metric}: ${coverage?.[metric]?.total ? `${coverage[metric].percentage.toFixed(1)}%` : "unavailable"}`,
							)
							.join("; "),
						`\`${dataset.source.sha.slice(0, 7)}\` (${ReportRenderer.text(dataset.source.kind)})`,
					]),
				),
			);
		return ReportRenderer.details(`Coverage: ${title}`, body.join("\n\n"));
	}

	render({ comment = false } = {}) {
		const selected = this.selected(comment);
		if (comment && !Object.values(selected).some(Boolean)) return "";
		const errors = this.errors;
		const { tests, lint } = this.findings();
		const publicationFailed = this.receipts.some(
			(receipt) => receipt.status === "failed",
		);
		const incomplete =
			this.collection.errors.length ||
			this.collection.checks.some(
				(check) => !check.result || check.result.errors.length,
			);
		const title = errors.length
			? publicationFailed
				? "Publication failed"
				: incomplete
					? "Reports incomplete"
					: "CI checks failed"
			: "CI checks passed";
		const outcome = errors.length
			? "Required execution, evidence, or publication did not complete successfully."
			: "Checks, report validation, and selected publication completed successfully.";
		const identity = this.collection.identity;
		const parts = [
			`## ${errors.length ? "❌" : "✅"} ${title}`,
			outcome,
			`${this.link(`Run ${identity.runId}, attempt ${identity.attempt}`, this.runUrl)} · Workflow revision \`${identity.sha.slice(0, 7)}\`.`,
			`Tested sources: ${[...new Set(this.collection.checks.map((check) => `\`${check.source.sha.slice(0, 7)}\` (${ReportRenderer.text(check.source.kind)})`))].join(", ")}.`,
		];
		if (errors.length)
			parts.push(
				`### Needs attention\n\n${errors
					.slice(0, 8)
					.map((error) => `- ${ReportRenderer.text(error, 220)}`)
					.join(
						"\n",
					)}${errors.length > 8 ? `\n\nShowing 8 of ${errors.length} problems. See the full report artifacts.` : ""}`,
			);
		const failures = tests.filter((item) =>
			["failed", "error"].includes(item.status),
		);
		if (selected.test && failures.length)
			parts.push(
				`**${failures.length} failed test executions.** ${this.link("Open a failing job", failures[0].check.job.html_url)}.`,
			);
		if (selected.lint && lint.some((issue) => issue.severity === "error"))
			parts.push(
				`**${lint.filter((issue) => issue.severity === "error").length} lint errors.** ${this.link("Open lint diagnostics", lint.find((issue) => issue.severity === "error").check.job.html_url)}.`,
			);
		if (selected.test) parts.push(this.tests(tests, comment));
		if (selected.lint) parts.push(this.lint(lint));
		if (selected.coverage) parts.push(this.coverage(comment));
		if (!comment)
			parts.push(
				ReportRenderer.details(
					"Workflow checks and conditional skips",
					`${ReportRenderer.table(
						["Caller job", "Outcome"],
						Object.entries(this.collection.jobs).map(([name, job]) => [
							ReportRenderer.text(name),
							ReportRenderer.text(job.result),
						]),
					)}\n\nThese are job outcomes. Status-only checks do not imply structured test counts. Existing route validators determine whether skips are intentional.`,
				),
			);
		const receipts = comment
			? this.receipts.filter((receipt) => receipt.reporter !== "comment")
			: this.receipts;
		if (receipts.length)
			parts.push(
				ReportRenderer.details(
					`Publication: ${receipts.filter((receipt) => receipt.status === "failed").length} failed; ${receipts.filter((receipt) => receipt.status === "unavailable").length} unavailable`,
					ReportRenderer.table(
						["Destination / dataset", "Outcome", "Details"],
						receipts.map((receipt) => [
							ReportRenderer.text(
								`${receipt.reporter} / ${this.collection.datasets.find((dataset) => dataset.id === receipt.dataset)?.label || receipt.dataset}`,
							),
							ReportRenderer.text(receipt.status),
							receipt.url
								? this.link(receipt.message || "Provider result", receipt.url)
								: ReportRenderer.text(receipt.message),
						]),
					),
				),
			);
		if (!comment)
			parts.push(
				ReportRenderer.details(
					"Report provenance and rerun details",
					`${ReportRenderer.table(
						["Check", "Original execution", "Source"],
						this.collection.checks.map((check) => [
							ReportRenderer.text(check.check.name),
							this.link(
								`Attempt ${check.execution.attempt}, job ${check.execution.job.id}`,
								check.job.html_url,
							),
							`\`${check.source.sha.slice(0, 7)}\` (${ReportRenderer.text(check.source.kind)})`,
						]),
						100,
					)}\n\nEarlier evidence is reused only for executions verified unchanged in this run.`,
				),
			);
		parts.push(
			`${this.link("Full Actions report and native artifacts", this.runUrl)}.`,
		);
		const budget = comment ? 32 * 1024 : 256 * 1024;
		let markdown = `${parts.filter(Boolean).join("\n\n")}\n`;
		if (Buffer.byteLength(markdown) > budget) {
			const notice = `\n\nDetailed results exceed this view's size limit. ${this.link("Read all retained results", this.runUrl)}.\n`;
			markdown = "";
			for (const part of parts.filter(Boolean))
				if (Buffer.byteLength(markdown + part + notice) < budget - 2)
					markdown += `${part}\n\n`;
			markdown += notice;
		}
		return markdown;
	}
}
