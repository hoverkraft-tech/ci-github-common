import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Shared validation for immutable registrations, results and retained assets. */
export const Protocol = {
	version: 2,
	prefix: "ci-report-v2-",
	kinds: ["test", "lint", "coverage"],
	maxFileBytes: 64 * 1024 * 1024,
	maxBundleBytes: 256 * 1024 * 1024,

	digest(value) {
		return createHash("sha256").update(value).digest("hex");
	},

	hasControl(value) {
		return [...value].some(
			(character) =>
				character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
		);
	},

	object(value, label) {
		if (!value || typeof value !== "object" || Array.isArray(value))
			throw new Error(`${label} must be an object.`);
		return value;
	},

	relative(value, { root = false, pattern = false } = {}) {
		if (root && value === ".") return value;
		if (
			typeof value !== "string" ||
			!value ||
			value.length > 1024 ||
			value.includes("\\") ||
			Protocol.hasControl(value) ||
			path.isAbsolute(value) ||
			value.split("/").some((part) => !part || part === "." || part === "..") ||
			(!pattern && /[*?{}[\]]/.test(value))
		)
			throw new Error(
				`Unsafe relative report path: ${String(value).slice(0, 120)}`,
			);
		return value;
	},

	file(directory, relative) {
		const root = fs.realpathSync(directory);
		const file = path.join(root, Protocol.relative(relative));
		const stat = fs.lstatSync(file);
		if (!stat.isFile() || fs.realpathSync(file) !== file)
			throw new Error("Report assets must be regular files without symlinks.");
		if (stat.size > Protocol.maxFileBytes)
			throw new Error("Report asset exceeds 64 MiB.");
		return file;
	},

	read(directory, filename) {
		const file = Protocol.file(directory, filename);
		if (fs.statSync(file).size > 4 * 1024 * 1024)
			throw new Error("Report metadata exceeds 4 MiB.");
		return JSON.parse(fs.readFileSync(file, "utf8"));
	},

	write(directory, filename, value) {
		const content = JSON.stringify(value);
		if (Buffer.byteLength(content) > 4 * 1024 * 1024)
			throw new Error("Report metadata exceeds 4 MiB.");
		fs.writeFileSync(path.join(directory, filename), content);
	},

	definition(value) {
		const definition = Protocol.object(structuredClone(value), "definition");
		const allowed = [
			"name",
			"project",
			"suite",
			"variant",
			"reports",
			"source",
			"subject",
			"path-mapping",
		];
		if (Object.keys(definition).some((key) => !allowed.includes(key)))
			throw new Error("Unknown check definition field.");
		definition.name ??= "Custom check";
		definition.project ??= ".";
		definition.suite ??= "default";
		for (const key of ["name", "suite"])
			if (
				typeof definition[key] !== "string" ||
				!definition[key].trim() ||
				definition[key].length > 200
			)
				throw new Error(`Invalid check ${key}.`);
		Protocol.relative(definition.project, { root: true });
		definition.variant ??= {};
		Protocol.object(definition.variant, "variant");
		if (
			Object.entries(definition.variant).some(
				([key, value]) =>
					!/^[\w-]{1,40}$/.test(key) ||
					typeof value !== "string" ||
					value.length > 120,
			)
		)
			throw new Error("Variant dimensions must be bounded string values.");
		if (definition["path-mapping"]) {
			Protocol.object(definition["path-mapping"], "path-mapping");
			for (const [prefix, target] of Object.entries(
				definition["path-mapping"],
			)) {
				if (!prefix || prefix.length > 1024 || Protocol.hasControl(prefix))
					throw new Error("Invalid source path prefix.");
				Protocol.relative(target, { root: true });
			}
		}
		if (
			definition.source &&
			(!/^[a-f0-9]{40}$/.test(definition.source.sha) ||
				Object.keys(definition.source).some((key) => key !== "sha"))
		)
			throw new Error("Source must contain the exact tested commit SHA.");
		if (definition.subject) {
			Protocol.object(definition.subject, "subject");
			const subject = definition.subject;
			if (
				Object.keys(subject).some(
					(key) =>
						!["kind", "name", "digest", "platform", "engine"].includes(key),
				)
			)
				throw new Error("Unknown tested subject field.");
			if (
				!["image", "archive"].includes(subject.kind) ||
				!/^sha256:[a-f0-9]{64}$/.test(subject.digest || "") ||
				typeof subject.name !== "string" ||
				!subject.name ||
				subject.name.length > 500
			)
				throw new Error(
					"Tested subjects require an image/archive kind, name and SHA-256 digest.",
				);
			for (const field of ["platform", "engine"])
				if (
					subject[field] !== undefined &&
					(typeof subject[field] !== "string" || subject[field].length > 100)
				)
					throw new Error("Invalid tested subject metadata.");
		}
		if (
			!Array.isArray(definition.reports) ||
			!definition.reports.length ||
			definition.reports.length > 128
		)
			throw new Error("A recording requires 1-128 typed report selectors.");
		for (const report of definition.reports) {
			Protocol.object(report, "report selector");
			if (
				Object.keys(report).some(
					(key) =>
						![
							"kind",
							"pattern",
							"optional",
							"owner",
							"language",
							"dataset",
							"role",
							"shards",
						].includes(key),
				)
			)
				throw new Error("Unknown report selector field.");
			if (!Protocol.kinds.includes(report.kind))
				throw new Error("Unknown report kind.");
			Protocol.relative(report.pattern, { pattern: true });
			if (report.optional !== undefined && typeof report.optional !== "boolean")
				throw new Error("optional must be a boolean.");
			if (
				report.owner !== undefined &&
				!["collector", "tool"].includes(report.owner)
			)
				throw new Error("Unknown diagnostic owner.");
			if (report.kind === "coverage") {
				if (
					report.language !== undefined &&
					!/^[A-Za-z][A-Za-z0-9 #+.-]{0,79}$/.test(report.language)
				)
					throw new Error("Invalid coverage language.");
				report.dataset ??= definition.suite;
				Protocol.relative(report.dataset);
				if (!/^[\w.-][\w./-]{0,199}$/.test(report.dataset))
					throw new Error("Invalid coverage dataset key.");
				report.role ??= "primary";
				if (!["primary", "diagnostic"].includes(report.role))
					throw new Error("Invalid coverage role.");
				if (report.shards) {
					Protocol.object(report.shards, "coverage shards");
					for (const field of ["expected", "included"])
						if (
							!Array.isArray(report.shards[field]) ||
							report.shards[field].some(
								(id) => typeof id !== "string" || !/^[\w.-]{1,80}$/.test(id),
							) ||
							new Set(report.shards[field]).size !== report.shards[field].length
						)
							throw new Error(
								"Shards must contain unique expected and included identifiers.",
							);
					if (
						!report.shards.expected.length ||
						JSON.stringify([...report.shards.expected].sort()) !==
							JSON.stringify([...report.shards.included].sort())
					)
						throw new Error(
							"Native coverage merge is missing promised shards.",
						);
				}
			}
		}
		return definition;
	},

	registration(value, identity) {
		Protocol.object(value, "registration");
		if (
			value.version !== Protocol.version ||
			!/^[0-9a-f-]{36}$/.test(value.id || "")
		)
			throw new Error("Unsupported or invalid recording identity.");
		for (const key of ["repository", "repositoryId", "runId"])
			if (String(value.execution?.[key]) !== String(identity[key]))
				throw new Error(`Recording ${key} does not match the originating run.`);
		if (
			!/^[a-f0-9]{40}$/.test(value.source?.sha || "") ||
			!["pr-head", "pr-merge", "branch"].includes(value.source.kind)
		)
			throw new Error("Invalid tested source revision.");
		Protocol.definition(value.check);
		return value;
	},
};
