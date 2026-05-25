import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { readJsonFile } from "./json-loader.mjs";
import { resolveInside, toPath } from "./paths.mjs";
import { buildPanelGraph } from "./panel-graph.mjs";
import { defaultDbPath } from "./storage/schema.mjs";

export async function runChecks({ rootDir = process.cwd(), runCommands = true } = {}) {
  const rootPath = toPath(rootDir);
  const checks = [];

  const entry = await readJsonFile(resolveInside(rootPath, "config/entry.json"));
  const profile = await readJsonFile(resolveInside(rootPath, "config/profile.json"));
  const projects = await readJsonFile(resolveInside(rootPath, "config/projects/index.json"));
  const scenes = await readJsonFile(resolveInside(rootPath, "config/scenes/index.json"));
  const skills = await readJsonFile(resolveInside(rootPath, "config/skills/skills.json"));
  const rules = await readJsonFile(resolveInside(rootPath, "config/rules/rules.json"));
  const current = await readJsonFile(resolveInside(rootPath, "runtime/current.json"));

  checks.push(await fileCheck(rootPath, "frontend_package_json", "Frontend package.json", "frontend", "package.json"));
  checks.push(await directoryCheck(rootPath, "frontend_dependencies", "Frontend dependencies", "frontend", "node_modules", "install_frontend_dependencies"));
  checks.push(await viteAppCheck(rootPath));
  checks.push(jsonCheck("entry_json", "Entry JSON", "config", entry));
  checks.push(jsonCheck("profile_json", "Profile JSON", "profile", profile, "create_minimal_profile_json"));
  if (!profile.ok) {
    checks.push(await fileCheck(rootPath, "person_profile_doc", "Persona profile document", "profile", "docs/person/profile.md", "create_minimal_person_profile"));
  } else if (profile.data?.sourcePath) {
    checks.push(await fileCheck(rootPath, "person_profile_doc", "Persona profile document", "profile", profile.data.sourcePath, "create_minimal_person_profile"));
  } else {
    checks.push({
      id: "person_profile_doc",
      title: "Persona profile document",
      area: "profile",
      status: "pass",
      message: "Fresh install has no profile document yet. Run devflow-init to create one."
    });
  }
  checks.push(jsonCheck("projects_index", "Projects index", "config", projects));
  checks.push(jsonCheck("scenes_index", "Scenes index", "config", scenes));
  checks.push(jsonCheck("skills_catalog", "Skills catalog", "config", skills));
  checks.push(jsonCheck("rules_catalog", "Rules catalog", "config", rules));
  checks.push(await projectDocsCheck(rootPath, projects));
  checks.push(jsonCheck("runtime_current", "Runtime current", "config", current));
  checks.push(await activeTaskCheck(rootPath, current));

  const graph = await buildChecksGraph(rootPath);
  checks.push({
    id: "graph_references",
    title: "Graph references",
    area: "graph",
    status: graph.warnings.some((warning) => warning.code === "missing_graph_reference") ? "warning" : "pass",
    message: graph.warnings.some((warning) => warning.code === "missing_graph_reference")
      ? "Some graph references point to missing nodes."
      : "Graph references resolved."
  });

  checks.push(await commandCheck(rootPath, "install_command", "Install command", ["node", "scripts/install-ai-context.mjs", "install", "--dry-run"], runCommands, {
    dryMessage: "Install command is available as an action but not executed by checks."
  }));
  checks.push(await commandCheck(rootPath, "install_check_command", "Install check command", ["node", "scripts/install-ai-context.mjs", "check"], runCommands));
  checks.push(await commandCheck(rootPath, "install_validate_command", "Install validate command", ["node", "scripts/install-ai-context.mjs", "validate"], runCommands));
  checks.push(await skillLinksCheck(rootPath, entry));
  checks.push(await commandCheck(rootPath, "project_entry_sync_drift", "Project entry sync drift", ["node", "scripts/install-ai-context.mjs", "sync-projects"], runCommands));

  return { checks };
}

async function buildChecksGraph(rootPath) {
  const dbPath = defaultDbPath(rootPath);
  if (!fsSync.existsSync(dbPath)) {
    const module = await import("./storage/rebuild-index.mjs");
    await module.rebuildDevFlowIndex({ rootDir: rootPath, dbPath });
  }
  const module = await import("./repositories/sqlite-repository.mjs");
  const repository = module.createSqliteRepository({ rootDir: rootPath, dbPath });
  return buildPanelGraph(repository, { rootDir: rootPath });
}

function jsonCheck(id, title, area, result, actionId) {
  if (result.ok) {
    return { id, title, area, status: "pass", message: `${title} parsed.`, sourcePath: path.relative(process.cwd(), result.path) };
  }
  return {
    id,
    title,
    area,
    status: "fail",
    message: result.error.message,
    sourcePath: result.path,
    actionId
  };
}

async function fileCheck(rootPath, id, title, area, relativePath, actionId) {
  const exists = await existsAt(rootPath, relativePath);
  return {
    id,
    title,
    area,
    status: exists ? "pass" : "fail",
    message: exists ? `${title} exists.` : `${title} missing: ${relativePath}`,
    sourcePath: relativePath,
    actionId: exists ? undefined : actionId
  };
}

async function directoryCheck(rootPath, id, title, area, relativePath, actionId) {
  const exists = await existsAt(rootPath, relativePath);
  return {
    id,
    title,
    area,
    status: exists ? "pass" : "fail",
    message: exists ? `${title} installed.` : `${title} missing: ${relativePath}`,
    sourcePath: relativePath,
    actionId: exists ? undefined : actionId
  };
}

async function viteAppCheck(rootPath) {
  const panelPath = (await existsAt(rootPath, "apps/panel/index.html")) ? "apps/panel" : "src/app";
  const indexExists = await existsAt(rootPath, `${panelPath}/index.html`);
  const mainExists = await existsAt(rootPath, `${panelPath}/main.jsx`);
  const status = indexExists && mainExists ? "pass" : "fail";
  return {
    id: "panel_app_resolved",
    title: "Optional panel app",
    area: "panel",
    status,
    message: status === "pass" ? "Optional panel app entry files exist." : "Optional panel app entry files are missing.",
    sourcePath: panelPath
  };
}

async function projectDocsCheck(rootPath, projectsResult) {
  if (!projectsResult.ok) {
    return {
      id: "project_docs",
      title: "Project docs",
      area: "config",
      status: "fail",
      message: "Cannot check project docs because project index is unavailable."
    };
  }

  const missing = [];
  for (const project of projectsResult.data.projects || []) {
    const detail = await readJsonFile(resolveInside(rootPath, project.path || `config/projects/${project.id}.json`));
    const docPath = detail.data?.doc?.path;
    if (docPath && !(await existsAt(rootPath, docPath))) {
      missing.push(docPath);
    }
  }

  return {
    id: "project_docs",
    title: "Project docs",
    area: "config",
    status: missing.length ? "warning" : "pass",
    message: missing.length ? `Missing project docs: ${missing.join(", ")}` : "Project docs resolved."
  };
}

async function activeTaskCheck(rootPath, currentResult) {
  const taskPath = currentResult.data?.activeTaskPath;
  if (!taskPath) {
    return {
      id: "active_task_path",
      title: "Active task path",
      area: "config",
      status: "pass",
      message: "No active task path configured."
    };
  }
  return fileCheck(rootPath, "active_task_path", "Active task path", "config", taskPath);
}

async function commandCheck(rootPath, id, title, command, runCommands, options = {}) {
  if (runCommands === false) {
    return {
      id,
      title,
      area: "install",
      status: "warning",
      message: options.dryMessage || "Not run in dry check mode."
    };
  }
  const result = await runCommand(command, { cwd: rootPath, timeoutMs: 15000 });
  return {
    id,
    title,
    area: "install",
    status: result.ok ? "pass" : "warning",
    message: result.ok ? `${title} passed.` : result.output || `${title} failed.`
  };
}

async function skillLinksCheck(rootPath, entryResult) {
  const links = entryResult.data?.installation?.skillLinks || [];
  const missing = [];
  for (const linkText of links) {
    const [rawLink, rawTarget] = String(linkText).split("->").map((part) => part.trim());
    if (!rawLink || !rawTarget) {
      missing.push(linkText);
      continue;
    }
    const link = expandPath(rawLink, rootPath);
    const target = expandPath(rawTarget, rootPath);
    try {
      const stat = await fs.lstat(link);
      if (!stat.isSymbolicLink()) {
        missing.push(linkText);
        continue;
      }
      const actual = await fs.readlink(link);
      if (path.resolve(path.dirname(link), actual) !== target && path.resolve(actual) !== target) {
        missing.push(linkText);
      }
    } catch {
      missing.push(linkText);
    }
  }
  return {
    id: "ai_context_skill_links",
    title: "DevFlow skill links",
    area: "install",
    status: missing.length ? "warning" : "pass",
    message: missing.length ? `Missing or mismatched skill links: ${missing.join(", ")}` : "Skill links resolved.",
    actionId: missing.length ? "install_ai_context" : undefined
  };
}

async function existsAt(rootPath, relativePath) {
  if (!relativePath) {
    return false;
  }
  try {
    await fs.access(resolveInside(rootPath, relativePath));
    return true;
  } catch {
    return false;
  }
}

function expandPath(value, rootPath) {
  return String(value)
    .replace(/^~(?=$|\/)/, os.homedir())
    .replaceAll("<devflow-root>", rootPath)
    .replaceAll("<DevFlow-root>", rootPath);
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
