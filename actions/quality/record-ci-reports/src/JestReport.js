import { IstanbulCoverage } from "./IstanbulCoverage.js";
import { Protocol } from "./Protocol.js";

/** Vitest and Jest serialize test outcomes and the final Istanbul map together. */
export class JestReport {
	constructor(value) {
		this.value = Protocol.object(value, "Jest/Vitest report");
	}

	tests() {
		const report = this.value;
		if (
			!Array.isArray(report.testResults) ||
			typeof report.success !== "boolean"
		)
			throw new Error("Expected native Jest/Vitest testResults and success.");
		const tests = [];
		let assertions = 0;
		for (const suite of report.testResults) {
			if (
				typeof suite.name !== "string" ||
				!Array.isArray(suite.assertionResults) ||
				!["passed", "failed", "skipped", "focused"].includes(suite.status)
			)
				throw new Error("Invalid Jest/Vitest test suite.");
			for (const item of suite.assertionResults) {
				const name = item.fullName || item.title;
				const messages = item.failureMessages ?? [];
				const duration = item.duration ?? 0;
				if (
					typeof name !== "string" ||
					!name ||
					![
						"passed",
						"failed",
						"skipped",
						"pending",
						"todo",
						"disabled",
					].includes(item.status) ||
					!Array.isArray(messages) ||
					messages.some((message) => typeof message !== "string") ||
					!Number.isFinite(duration) ||
					duration < 0
				)
					throw new Error("Invalid Jest/Vitest assertion result.");
				tests.push({
					name,
					status: ["passed", "failed"].includes(item.status)
						? item.status
						: "skipped",
					duration: duration / 1000,
					message: messages.join("\n"),
					stackTrace: messages.join("\n"),
					file: suite.name,
					suite: suite.name,
				});
				assertions++;
			}
			// Setup, teardown and worker failures may have no failed assertion.
			if (
				suite.status === "failed" &&
				!suite.assertionResults.some((item) => item.status === "failed")
			)
				tests.push({
					name: suite.name,
					status: "error",
					duration: 0,
					file: suite.name,
					message:
						typeof suite.message === "string"
							? suite.message
							: "Test suite failed before reporting an assertion.",
				});
		}
		if (
			!Number.isSafeInteger(report.numTotalTests) ||
			report.numTotalTests !== assertions
		)
			throw new Error("Jest/Vitest test count does not match its assertions.");
		if (
			!report.success &&
			!tests.some((item) => ["failed", "error"].includes(item.status))
		)
			tests.push({
				name: "Test run",
				status: "error",
				duration: 0,
				file: "",
				message:
					"The runner reported an unsuccessful run. See its native report and job logs.",
			});
		if (!tests.length)
			throw new Error("Required test report has no test cases.");
		return tests;
	}

	native(kind) {
		if (kind === "coverage") {
			const coverage = new IstanbulCoverage(this.value.coverageMap);
			return {
				format: "jest-json",
				data: { tests: [], lintIssues: [], coverage: coverage.summary() },
				sourceFiles: coverage.map.files(),
			};
		}
		return {
			format: "jest-json",
			data: { tests: this.tests(), lintIssues: [] },
			sourceFiles: [],
		};
	}
}
