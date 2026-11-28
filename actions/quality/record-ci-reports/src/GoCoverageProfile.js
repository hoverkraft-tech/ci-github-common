/** Read Go's native block profile, preserving its statement-weighted measurement. */
export class GoCoverageProfile {
	constructor(content) {
		const [header, ...rows] = content.trim().split(/\r?\n/);
		if (!/^mode: (set|count|atomic)$/.test(header))
			throw new Error("Invalid Go coverage mode.");
		this.mode = header.slice(6);
		const blocks = new Map();
		let span = 0;
		for (const row of rows) {
			const match = /^(.+\.go):(\d+)\.(\d+),(\d+)\.(\d+) (\d+) (\d+)$/.exec(
				row,
			);
			if (!match) throw new Error("Invalid Go coverage block.");
			const [, source, ...values] = match;
			const [start, startColumn, end, endColumn, statements, hits] =
				values.map(Number);
			if (
				values.some((value) => !Number.isSafeInteger(Number(value))) ||
				start < 1 ||
				startColumn < 1 ||
				endColumn < 1 ||
				end < start ||
				(end === start && endColumn < startColumn)
			)
				throw new Error("Invalid Go coverage coordinates or counts.");
			const key = `${source}:${start}.${startColumn},${end}.${endColumn}`;
			const previous = blocks.get(key);
			if (previous && previous.statements !== statements)
				throw new Error("Conflicting Go statement counts for the same block.");
			const count =
				this.mode === "set"
					? Number(Boolean(hits || previous?.hits))
					: hits + (previous?.hits || 0);
			if (!Number.isSafeInteger(count))
				throw new Error(
					"Go coverage hit count exceeds the safe integer range.",
				);
			blocks.set(key, {
				source,
				start,
				startColumn,
				end,
				endColumn,
				statements,
				hits: count,
			});
			span += end - start + 1;
			if (span > 1_000_000)
				throw new Error("Go coverage exceeds one million line measurements.");
		}
		this.blocks = [...blocks.values()];
		this.sourceFiles = [...new Set(this.blocks.map((block) => block.source))];
		const total = this.blocks.reduce((sum, block) => sum + block.statements, 0);
		const covered = this.blocks.reduce(
			(sum, block) => sum + (block.hits ? block.statements : 0),
			0,
		);
		if (!Number.isSafeInteger(total) || total < 1)
			throw new Error("Go coverage has no valid instrumented statements.");
		this.statements = { total, covered, percentage: (covered / total) * 100 };
	}

	/** Line-oriented destinations use the same inclusive block spans as Coveralls. */
	lineMeasurements(sourceMap) {
		const files = new Map();
		for (const block of this.blocks) {
			const source = sourceMap[block.source];
			if (!source) throw new Error("Go coverage source mapping is missing.");
			if (!files.has(source)) files.set(source, new Map());
			const lines = files.get(source);
			for (let line = block.start; line <= block.end; line++) {
				const hits = (lines.get(line) || 0) + block.hits;
				if (!Number.isSafeInteger(hits))
					throw new Error("Go line hit count exceeds the safe integer range.");
				lines.set(line, hits);
			}
		}
		return files;
	}

	lcov(sourceMap) {
		const output = [];
		for (const [source, lines] of this.lineMeasurements(sourceMap)) {
			output.push(`SF:${source}`);
			for (const [line, hits] of [...lines].sort(
				([left], [right]) => left - right,
			))
				output.push(`DA:${line},${hits}`);
			output.push(
				`LF:${lines.size}`,
				`LH:${[...lines.values()].filter(Boolean).length}`,
				"end_of_record",
			);
		}
		return `${output.join("\n")}\n`;
	}

	native() {
		const files = this.lineMeasurements(
			Object.fromEntries(this.sourceFiles.map((source) => [source, source])),
		);
		const lines = [...files.values()].flatMap((value) => [...value.values()]);
		const covered = lines.filter(Boolean).length;
		return {
			format: "golang",
			sourceFiles: this.sourceFiles,
			data: {
				tests: [],
				lintIssues: [],
				coverage: {
					metric: "statements",
					statements: this.statements,
					lines: {
						total: lines.length,
						covered,
						percentage: (covered / lines.length) * 100,
					},
				},
			},
		};
	}
}
