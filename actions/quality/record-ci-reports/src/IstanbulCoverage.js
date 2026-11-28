import path from "node:path";
import coverage from "istanbul-lib-coverage";
import report from "istanbul-lib-report";
// Import the pinned writers statically so ncc bundles their dependencies.
// The dynamic report factory copies CommonJS files into this ESM action.
import Cobertura from "istanbul-reports/lib/cobertura/index.js";
import Lcov from "istanbul-reports/lib/lcovonly/index.js";
import { Protocol } from "./Protocol.js";

/** Use Istanbul's native line semantics and writers, retaining the original map. */
export class IstanbulCoverage {
	constructor(value) {
		Protocol.object(value, "coverageMap");
		for (const [source, file] of Object.entries(value)) {
			if (!source || Protocol.hasControl(source) || file?.path !== source)
				throw new Error("Coverage source key and path must match.");
			for (const [counts, locations] of [
				["s", "statementMap"],
				["f", "fnMap"],
				["b", "branchMap"],
			]) {
				Protocol.object(file[counts], `coverage ${counts}`);
				Protocol.object(file[locations], `coverage ${locations}`);
				if (
					JSON.stringify(Object.keys(file[counts]).sort()) !==
					JSON.stringify(Object.keys(file[locations]).sort())
				)
					throw new Error("Coverage counts and locations do not match.");
				for (const [id, count] of Object.entries(file[counts])) {
					const location = file[locations][id];
					const hits = counts === "b" ? count : [count];
					if (
						!Array.isArray(hits) ||
						hits.some((hit) => !Number.isSafeInteger(hit) || hit < 0)
					)
						throw new Error("Invalid Istanbul coverage hit counts.");
					IstanbulCoverage.location(counts === "s" ? location : location.loc);
					if (counts === "f") {
						if (
							typeof location.name !== "string" ||
							Protocol.hasControl(location.name)
						)
							throw new Error("Invalid coverage function name.");
						if (location.decl) IstanbulCoverage.location(location.decl);
					}
					if (counts === "b") {
						if (
							!Array.isArray(location.locations) ||
							location.locations.length !== hits.length
						)
							throw new Error(
								"Coverage branch counts and locations do not match.",
							);
						for (const branch of location.locations)
							IstanbulCoverage.location(branch, true);
					}
				}
			}
		}
		this.map = coverage.createCoverageMap(value);
		if (this.map.getCoverageSummary().lines.total < 1)
			throw new Error("Required coverage report has no instrumented lines.");
	}

	static location(value, implicitBranch = false) {
		// Istanbul represents an implicit else with empty positions, and JSON
		// serializes V8's infinite end-of-line column as null.
		if (
			implicitBranch &&
			value?.start &&
			value?.end &&
			Object.keys(value.start).length === 0 &&
			Object.keys(value.end).length === 0
		)
			return;
		for (const [side, point] of [
			["start", value?.start],
			["end", value?.end],
		])
			if (
				!Number.isSafeInteger(point?.line) ||
				point.line < 1 ||
				(!(side === "end" && point.column === null) &&
					(!Number.isSafeInteger(point?.column) || point.column < 0))
			)
				throw new Error("Invalid Istanbul source location.");
		if (
			value.end.line < value.start.line ||
			(value.end.line === value.start.line &&
				value.end.column !== null &&
				value.end.column < value.start.column)
		)
			throw new Error("Invalid Istanbul source range.");
	}

	summary() {
		const summary = this.map.getCoverageSummary();
		return Object.fromEntries(
			["lines", "statements", "functions", "branches"].map((kind) => {
				const { total, covered } = summary[kind];
				return [
					kind,
					{ total, covered, percentage: total ? (covered / total) * 100 : 100 },
				];
			}),
		);
	}

	measurement(sourceMap) {
		if (
			new Set(this.map.files().map((file) => sourceMap[file])).size !==
			this.map.files().length
		)
			throw new Error(
				"Coverage sources must map to distinct repository files.",
			);
		const lines = [];
		for (const source of this.map.files())
			for (const [line, hits] of Object.entries(
				this.map.fileCoverageFor(source).getLineCoverage(),
			))
				lines.push([`${sourceMap[source]}:${line}`, hits > 0]);
		const covered = lines.filter(([, hit]) => hit).length;
		return {
			measurementDigest: Protocol.digest(
				JSON.stringify(
					lines.sort(([left], [right]) => left.localeCompare(right)),
				),
			),
			lines: {
				total: lines.length,
				covered,
				percentage: (covered / lines.length) * 100,
			},
		};
	}

	write(directory, format, sourceMap) {
		const mapped = coverage.createCoverageMap({});
		for (const source of this.map.files()) {
			const file = structuredClone(this.map.fileCoverageFor(source).toJSON());
			file.path = Protocol.relative(sourceMap[source]);
			for (const fn of Object.values(file.fnMap)) fn.decl ??= fn.loc;
			mapped.addFileCoverage(file);
		}
		const file = format === "cobertura" ? "coverage.xml" : "coverage.info";
		const Writer = format === "cobertura" ? Cobertura : Lcov;
		new Writer({
			file,
			projectRoot: ".",
		}).execute(
			report.createContext({
				dir: directory,
				coverageMap: mapped,
				sourceFinder: () => {
					throw new Error(
						"Coverage publication must not read project sources.",
					);
				},
			}),
		);
		return { file: path.join(directory, file), format };
	}
}
