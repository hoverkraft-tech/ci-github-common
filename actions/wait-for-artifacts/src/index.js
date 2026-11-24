import { DefaultArtifactClient } from "@actions/artifact";
import { ArtifactAvailability } from "./ArtifactAvailability.js";

export async function run({
	core,
	artifactIds,
	client = new DefaultArtifactClient(),
	sleep,
}) {
	await new ArtifactAvailability({ client, core, sleep }).waitFor(artifactIds);
}
