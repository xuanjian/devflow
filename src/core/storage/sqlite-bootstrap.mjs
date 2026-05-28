import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CURRENT } from "../defaults/current.mjs";
import { DEFAULT_DEVFLOW_PROJECT } from "../defaults/devflow-project.mjs";
import { DEFAULT_ENTRY, ENTRY_CONFIG_KEY } from "../defaults/entry.mjs";
import { DEFAULT_GATES, GATES_CONFIG_KEY } from "../defaults/gates.mjs";
import { DEFAULT_PROFILE, PROFILE_CONFIG_KEY } from "../defaults/profile.mjs";
import { resolveInside, toPath } from "../paths.mjs";
import { applyMigrationSnapshot } from "./migrate-from-json.mjs";
import { defaultDbPath, initializeSchema, openDevFlowDatabase } from "./schema.mjs";

export async function ensureSqliteDatabase({ rootDir = process.cwd(), dbPath = defaultDbPath(rootDir) } = {}) {
  const rootPath = toPath(rootDir);
  const resolvedDbPath = toPath(dbPath);
  if (fs.existsSync(resolvedDbPath)) {
    return { status: "exists", dbPath: resolvedDbPath };
  }

  if (hasLegacyJsonSources(rootPath)) {
    throw new Error(
      "DevFlow SQLite database is missing, but legacy config/runtime JSON sources are still present. Run `devflow migrate from-json` explicitly before using this checkout; automatic JSON rebuild is disabled."
    );
  }

  fs.mkdirSync(path.dirname(resolvedDbPath), { recursive: true });
  const db = openDevFlowDatabase({ rootDir: rootPath, dbPath: resolvedDbPath });
  try {
    initializeSchema(db);
    applyMigrationSnapshot(db, buildDefaultSnapshot(rootPath, resolvedDbPath));
  } finally {
    db.close();
  }
  return { status: "created", dbPath: resolvedDbPath };
}

export function hasLegacyJsonSources(rootDir = process.cwd()) {
  const rootPath = toPath(rootDir);
  return ["config", "runtime"].some((relativeRoot) => hasJsonFile(resolveInside(rootPath, relativeRoot)));
}

function buildDefaultSnapshot(rootPath, dbPath) {
  return {
    rootPath,
    dbPath,
    configRecords: [
      { key: ENTRY_CONFIG_KEY, path: "defaults/entry", data: DEFAULT_ENTRY },
      { key: PROFILE_CONFIG_KEY, path: "defaults/profile", data: DEFAULT_PROFILE },
      { key: GATES_CONFIG_KEY, path: "defaults/gates", data: DEFAULT_GATES }
    ],
    projects: [DEFAULT_DEVFLOW_PROJECT],
    sceneTemplates: [],
    skills: [],
    rules: [],
    tasks: [],
    taskDocuments: [],
    runtimeState: DEFAULT_CURRENT,
    graphEdges: [],
    sourceJsonPaths: [],
    warnings: [],
    sourceCounts: {
      config: 3,
      projects: 1,
      sceneTemplates: 0,
      skills: 0,
      rules: 0,
      tasks: 0,
      taskDocuments: 0,
      runtimeState: 1,
      graphEdges: 0
    }
  };
}

function hasJsonFile(startPath) {
  if (!fs.existsSync(startPath)) return false;
  const stat = fs.statSync(startPath);
  if (stat.isFile()) return startPath.endsWith(".json");
  if (!stat.isDirectory()) return false;
  for (const entry of fs.readdirSync(startPath, { withFileTypes: true })) {
    if (hasJsonFile(path.join(startPath, entry.name))) return true;
  }
  return false;
}
