import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { readJsonFile } from "./json-loader.mjs";
import { resolveInside, toPath } from "./paths.mjs";

const COMMAND_TIMEOUT_MS = 60000;

const ACTIONS = {
  install_frontend_dependencies: {
    run: ({ rootPath }) => runFixedCommand(rootPath, ["npm", "install"])
  },
  install_ai_context: {
    run: ({ rootPath }) => runFixedCommand(rootPath, ["node", "scripts/install-ai-context.mjs", "install"])
  },
  validate_ai_context: {
    run: ({ rootPath }) => runFixedCommand(rootPath, ["node", "scripts/install-ai-context.mjs", "validate"])
  },
  check_ai_context: {
    run: ({ rootPath }) => runFixedCommand(rootPath, ["node", "scripts/install-ai-context.mjs", "check"])
  },
  sync_project_entry: {
    run: syncProjectEntry
  },
  create_minimal_profile_json: {
    run: ({ rootPath, actionId }) => createFileOnce(rootPath, actionId, "config/profile.json", JSON.stringify({
      version: 1,
      sourcePath: "docs/person/profile.md",
      role: "TODO: fill in stable role and collaboration profile",
      collaborationPreferences: []
    }, null, 2) + "\n")
  },
  create_minimal_person_profile: {
    run: ({ rootPath, actionId }) => createFileOnce(rootPath, actionId, "docs/person/profile.md", "# Profile\n\nTODO: fill in real long-term preferences and collaboration context.\n")
  }
};

export async function runAction({ rootDir = process.cwd(), actionId, body = {} } = {}) {
  const rootPath = toPath(rootDir);
  const action = ACTIONS[actionId];
  if (!action) {
    return actionError(actionId, "unsupported_action", `Unsupported action: ${actionId}`);
  }

  try {
    return await action.run({ rootPath, actionId, body });
  } catch (error) {
    return actionError(actionId, "action_failed", error?.message || String(error));
  }
}

async function syncProjectEntry({ rootPath, actionId, body }) {
  const projectId = body?.projectId;
  if (!projectId || typeof projectId !== "string" || projectId.includes("/") || projectId.includes("..")) {
    return actionError(actionId, "invalid_project_id", "sync_project_entry requires a safe projectId.");
  }

  const index = await readJsonFile(resolveInside(rootPath, "config/projects/index.json"));
  const exists = index.data?.projects?.some((project) => project.id === projectId);
  if (!exists) {
    return actionError(actionId, "invalid_project_id", `Unknown projectId: ${projectId}`);
  }

  return runFixedCommand(rootPath, ["node", "scripts/install-ai-context.mjs", "sync-projects", "--project", projectId, "--write"], actionId);
}

async function createFileOnce(rootPath, actionId, relativePath, contents) {
  const filePath = resolveInside(rootPath, relativePath);
  try {
    await fs.access(filePath);
    return actionError(undefined, "file_exists", `File already exists: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      return actionError(undefined, "action_failed", error.message);
    }
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
  return {
    ok: true,
    actionId,
    summary: `Created ${relativePath}`,
    output: "",
    changedPaths: [relativePath],
    nextCheckIds: ["profile_json", "person_profile_doc"]
  };
}

async function runFixedCommand(rootPath, command, actionId) {
  const result = await runCommand(command, { cwd: rootPath, timeoutMs: COMMAND_TIMEOUT_MS });
  return {
    ok: result.ok,
    actionId,
    summary: result.ok ? `Ran ${command.join(" ")}` : `Failed ${command.join(" ")}`,
    output: result.output,
    changedPaths: [],
    nextCheckIds: ["install_check_command", "install_validate_command"]
  };
}

function runCommand(command, { cwd, timeoutMs }) {
  return new Promise((resolve) => {
    const child = spawn(command[0], command.slice(1), { cwd, stdio: ["ignore", "pipe", "pipe"] });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({ ok: false, output: "Command timed out." });
    }, timeoutMs);
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ ok: false, output: error.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output: output.trim() });
    });
  });
}

function actionError(actionId, code, message) {
  return {
    ok: false,
    actionId,
    error: { code, message },
    summary: message,
    output: "",
    changedPaths: [],
    nextCheckIds: []
  };
}
