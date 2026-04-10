import { ActionRuntime } from "./ActionRuntime.js";
import { LocalActionsManager } from "./LocalActionsManager.js";

const runtime = new ActionRuntime();
const manager = new LocalActionsManager();

try {
  const destinationPath = runtime.getState("local_actions_destination_path");
  const cleaned = await manager.cleanup({
    created: runtime.getState("local_actions_created") === "true",
    destinationPath,
  });

  if (cleaned) {
    runtime.info(`Removed local actions from ${destinationPath}.`);
  } else {
    runtime.info("Skipped local actions cleanup.");
  }
} catch (error) {
  runtime.setFailed(error);
}
