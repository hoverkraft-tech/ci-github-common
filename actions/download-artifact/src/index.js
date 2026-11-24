import { DefaultArtifactClient } from "@actions/artifact";
import { ArtifactDownload } from "./ArtifactDownload.js";

export async function run({
	core,
	artifactIds,
	destination = process.env.GITHUB_WORKSPACE || process.cwd(),
	mergeMultiple = "false",
	skipDecompress = "false",
	githubToken = "",
	repository = process.env.GITHUB_REPOSITORY,
	runId = process.env.GITHUB_RUN_ID,
	client = new DefaultArtifactClient(),
	sleep,
}) {
	if (
		![mergeMultiple, skipDecompress].every((value) =>
			["true", "false"].includes(value),
		)
	) {
		throw new Error("merge-multiple and skip-decompress must be true or false");
	}
	let findBy;
	if (githubToken) {
		if (
			!/^[^/]+\/[^/]+$/.test(repository || "") ||
			!/^[1-9]\d*$/.test(runId || "") ||
			!Number.isSafeInteger(Number(runId))
		) {
			throw new Error(
				"github-token requires an owner/repository and a positive safe run-id",
			);
		}
		const [repositoryOwner, repositoryName] = repository.split("/");
		findBy = {
			token: githubToken,
			repositoryOwner,
			repositoryName,
			workflowRunId: Number(runId),
		};
	}
	await new ArtifactDownload({ client, core, sleep }).download({
		artifactIds,
		destination,
		mergeMultiple: mergeMultiple === "true",
		skipDecompress: skipDecompress === "true",
		findBy,
	});
}
