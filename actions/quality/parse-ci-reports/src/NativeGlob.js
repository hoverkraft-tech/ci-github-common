import fs from "node:fs";
import path from "node:path";

/** Node 24 supplies globbing without a separate matcher dependency. */
export const NativeGlob = {
	async create(patterns) {
		const entries = patterns.split(/\r?\n/).filter(Boolean);
		const include = entries.filter((pattern) => !pattern.startsWith("!"));
		const exclude = entries
			.filter((pattern) => pattern.startsWith("!"))
			.map((pattern) => pattern.slice(1));
		if (
			entries.length > 512 ||
			entries.some((pattern) => pattern.length > 2048)
		)
			throw new Error("Report discovery patterns exceed their resource limit.");
		return {
			async *globGenerator() {
				for (const filename of fs.globSync(include, { exclude })) {
					if (
						fs.lstatSync(filename).isFile() &&
						fs.realpathSync(filename) === path.resolve(filename)
					)
						yield filename;
				}
			},
		};
	},
};
