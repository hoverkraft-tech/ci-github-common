import { ActionRuntime } from "./ActionRuntime.js";
import { LocalActionsManager } from "./LocalActionsManager.js";

const runtime = new ActionRuntime();
const manager = new LocalActionsManager();

try {
  const sourcePath = runtime.getInput("source-path", { required: true });
  const workspacePath = runtime.getWorkspace();
  const sourceDirectory = await manager.resolveSourceDirectory({ sourcePath });
  const destinationPath = manager.resolveDestinationPath({ workspacePath });

  runtime.info(`Resolved local actions source: ${sourceDirectory}.`);
  runtime.info(`Resolved local actions destination: ${destinationPath}.`);

  const result = await manager.prepare({
    sourcePath,
    workspacePath,
  });

  await runtime.setOutput("path", result.destinationPath);
  await runtime.saveState("local_actions_created", String(result.created));
  await runtime.saveState(
    "local_actions_destination_path",
    result.destinationPath,
  );

  if (result.created) {
    runtime.info(`Copied local actions to ${result.destinationPath}.`);
  } else {
    runtime.info(
      `Local actions already available at ${result.destinationPath}.`,
    );
  }
} catch (error) {
  runtime.setFailed(error);
}
