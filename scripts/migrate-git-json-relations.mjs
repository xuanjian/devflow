#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { defaultDbPath, initializeSchema } from "../src/core/storage/schema.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDir, "..");
const args = parseArgs(process.argv.slice(2));
const rootDir = path.resolve(args.root || defaultRoot);
const ref = args.ref || "8b67fdd^";
const dbPath = args.db || defaultDbPath(rootDir);

const db = new Database(dbPath);
initializeSchema(db);

const projects = readIndexedRecords(ref, "config/projects/index.json", "projects");
const sceneTemplates = readIndexedRecords(ref, "config/scenes/index.json", "scenes");
const skills = readCatalog(ref, "config/skills/skills.json", "skills");
const rules = readCatalog(ref, "config/rules/rules.json", "rules");
const edges = buildGraphEdges({ projects, sceneTemplates, rules });
const currentState = readCurrentRuntimeState(rootDir);

const tx = db.transaction(() => {
  for (const project of projects) upsertProject(db, rootDir, project);
  for (const sceneTemplate of sceneTemplates) upsertSceneTemplate(db, rootDir, sceneTemplate);
  for (const skill of skills) upsertSkill(db, rootDir, skill);
  for (const rule of rules) upsertRule(db, rootDir, rule);
  for (const edge of edges) upsertGraphEdge(db, edge);
  materializeMissingWorksetRefs(db);
  if (args["clear-current"] !== false) {
    db.prepare("INSERT OR REPLACE INTO runtime_state (key, raw_json) VALUES (?, ?)").run("current", stringify(currentState));
  }
});
tx();

console.log(JSON.stringify({
  status: "ok",
  ref,
  dbPath: path.relative(rootDir, dbPath),
  imported: {
    projects: projects.length,
    sceneTemplates: sceneTemplates.length,
    skills: skills.length,
    rules: rules.length,
    graphEdges: edges.length
  },
  current: args["clear-current"] !== false ? "synced from runtime/current.json" : "unchanged"
}, null, 2));

function materializeMissingWorksetRefs(database) {
  const projectsById = new Map(database.prepare("SELECT id, raw_json FROM projects").all().map((row) => [row.id, JSON.parse(row.raw_json)]));
  const sceneTemplatesById = new Set(database.prepare("SELECT id FROM scene_templates").all().map((row) => row.id));
  const worksets = database.prepare("SELECT raw_json FROM worksets").all().map((row) => JSON.parse(row.raw_json));

  for (const workset of worksets) {
    for (const projectRef of workset.projects || []) {
      if (!projectRef.id || projectsById.has(projectRef.id)) continue;
      const alias = projectAliasFor(projectRef.id, projectsById);
      upsertProject(database, rootDir, alias || {
        id: projectRef.id,
        name: projectRef.id,
        summary: "Migrated project reference from a historical Workset. Full project metadata was not present in the selected Git ref.",
        sourcePath: "runtime/worksets",
        tags: ["migrated-workset-reference"]
      });
      projectsById.set(projectRef.id, alias || { id: projectRef.id });
    }

    if (workset.sceneTemplateId && !sceneTemplatesById.has(workset.sceneTemplateId)) {
      upsertSceneTemplate(database, rootDir, {
        id: workset.sceneTemplateId,
        templateType: "scene-template",
        name: workset.sceneTemplateId,
        summary: "Migrated scene-template reference from a historical Workset. Full scene metadata was not present in the selected Git ref.",
        sourcePath: "runtime/worksets",
        projectHints: workset.projects || [],
        skillHints: workset.skills || [],
        ruleHints: workset.rules || []
      });
      sceneTemplatesById.add(workset.sceneTemplateId);
    }
  }
}

function projectAliasFor(projectId, projectsById) {
  if (!projectId.endsWith("-ios")) return null;
  const baseId = projectId.slice(0, -"-ios".length);
  const base = projectsById.get(baseId);
  if (!base || base.technologyFamilyId !== "ios") return null;
  return {
    ...base,
    id: projectId,
    name: `${base.name || baseId} iOS`,
    sourcePath: base.sourcePath || "runtime/worksets",
    migratedAliasOf: baseId
  };
}

function readIndexedRecords(gitRef, indexPath, key) {
  const index = readGitJson(gitRef, indexPath);
  return (index[key] || []).map((item) => {
    const recordPath = item.path || `${path.dirname(indexPath)}/${item.id}.json`;
    const detail = readGitJson(gitRef, recordPath);
    return {
      ...item,
      ...detail,
      sourcePath: detail.sourcePath || detail.source?.path || recordPath
    };
  });
}

function readCatalog(gitRef, catalogPath, key) {
  try {
    const catalog = readGitJson(gitRef, catalogPath);
    return catalog[key] || [];
  } catch {
    return [];
  }
}

function readGitJson(gitRef, relativePath) {
  const raw = execFileSync("git", ["show", `${gitRef}:${relativePath}`], {
    cwd: rootDir,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  return JSON.parse(raw);
}

function readCurrentRuntimeState(repoRoot) {
  try {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, "runtime/current.json"), "utf8"));
  } catch {
    return {
      version: 1,
      activeTaskId: "",
      activeTaskPath: "",
      activeProjectIds: [],
      activeSceneIds: [],
      currentGate: "",
      recentTaskIds: []
    };
  }
}

function upsertProject(database, repoRoot, project) {
  database.prepare(`
    INSERT OR REPLACE INTO projects (id, name, technology_family_id, source_path, doc_path, raw_json)
    VALUES (@id, @name, @technologyFamilyId, @sourcePath, @docPath, @rawJson)
  `).run({
    id: project.id,
    name: project.name || project.id,
    technologyFamilyId: project.technologyFamilyId || "",
    sourcePath: project.sourcePath || "",
    docPath: project.doc?.path || "",
    rawJson: stringify(project)
  });
  insertDocument(database, repoRoot, "project", project.id, project.doc?.path);
  for (const skill of project.skills || []) insertRef(database, "project_skill_mounts", "project_id", project.id, "skill_id", skill.id, skill);
  for (const rule of project.rules || []) insertRef(database, "project_rule_mounts", "project_id", project.id, "rule_id", rule.id, rule);
}

function upsertSceneTemplate(database, repoRoot, sceneTemplate) {
  database.prepare(`
    INSERT OR REPLACE INTO scene_templates (id, name, summary, source_path, raw_json)
    VALUES (@id, @name, @summary, @sourcePath, @rawJson)
  `).run({
    id: sceneTemplate.id,
    name: sceneTemplate.name || sceneTemplate.id,
    summary: sceneTemplate.summary || "",
    sourcePath: sceneTemplate.sourcePath || sceneTemplate.source?.path || "",
    rawJson: stringify({ ...sceneTemplate, templateType: sceneTemplate.templateType || "scene-template" })
  });
  insertDocument(database, repoRoot, "sceneTemplate", sceneTemplate.id, sceneTemplate.sourcePath || sceneTemplate.source?.path);
  for (const capabilityId of sceneTemplate.capabilityIds || []) {
    database.prepare("INSERT OR REPLACE INTO capabilities (id, raw_json) VALUES (?, ?)").run(capabilityId, stringify({ id: capabilityId }));
    insertRef(database, "scene_template_capabilities", "scene_template_id", sceneTemplate.id, "capability_id", capabilityId, { id: capabilityId });
  }
  for (const project of sceneTemplate.projectHints || sceneTemplate.projects || []) {
    insertRef(database, "scene_template_project_hints", "scene_template_id", sceneTemplate.id, "project_id", project.id, project);
  }
  for (const skill of sceneTemplate.skillHints || []) {
    insertRef(database, "scene_template_skill_hints", "scene_template_id", sceneTemplate.id, "skill_id", skill.id, skill);
  }
  for (const rule of sceneTemplate.ruleHints || sceneTemplate.rules || []) {
    insertRef(database, "scene_template_rule_hints", "scene_template_id", sceneTemplate.id, "rule_id", rule.id, rule);
  }
}

function upsertSkill(database, repoRoot, skill) {
  database.prepare("INSERT OR REPLACE INTO skills (id, name, source_path, raw_json) VALUES (@id, @name, @sourcePath, @rawJson)").run({
    id: skill.id,
    name: skill.name || skill.id,
    sourcePath: skill.sourcePath || "",
    rawJson: stringify(skill)
  });
  insertDocument(database, repoRoot, "skill", skill.id, skill.sourcePath);
}

function upsertRule(database, repoRoot, rule) {
  database.prepare("INSERT OR REPLACE INTO rules (id, name, source_path, raw_json) VALUES (@id, @name, @sourcePath, @rawJson)").run({
    id: rule.id,
    name: rule.name || rule.id,
    sourcePath: rule.sourcePath || "",
    rawJson: stringify(rule)
  });
  insertDocument(database, repoRoot, "rule", rule.id, rule.sourcePath);
}

function upsertGraphEdge(database, edge) {
  database.prepare("INSERT OR REPLACE INTO graph_edges (from_id, to_id, relation, raw_json) VALUES (?, ?, ?, ?)").run(
    edge.from,
    edge.to,
    edge.relation,
    stringify(edge)
  );
}

function buildGraphEdges({ projects, sceneTemplates, rules }) {
  const edges = [];
  const addEdge = (from, to, relation) => {
    if (!from || !to || edges.some((edge) => edge.from === from && edge.to === to && edge.relation === relation)) return;
    edges.push({ from, to, relation });
  };

  for (const project of projects) {
    for (const scene of project.scenes || []) addEdge(`project:${project.id}`, `sceneTemplate:${scene.id}`, "uses-scene-template");
    for (const skill of project.skills || []) addEdge(`project:${project.id}`, `skill:${skill.id}`, "uses-skill");
    for (const rule of project.rules || []) addEdge(`project:${project.id}`, `rule:${rule.id}`, "uses-rule");
  }
  for (const sceneTemplate of sceneTemplates) {
    for (const project of sceneTemplate.projectHints || sceneTemplate.projects || []) addEdge(`sceneTemplate:${sceneTemplate.id}`, `project:${project.id}`, "hints-project");
    for (const skill of sceneTemplate.skillHints || []) addEdge(`sceneTemplate:${sceneTemplate.id}`, `skill:${skill.id}`, "hints-skill");
    for (const rule of sceneTemplate.ruleHints || sceneTemplate.rules || []) addEdge(`sceneTemplate:${sceneTemplate.id}`, `rule:${rule.id}`, "hints-rule");
  }
  for (const rule of rules) {
    for (const projectId of rule.projectIds || []) addEdge(`rule:${rule.id}`, `project:${projectId}`, "applies-project");
    for (const sceneId of rule.sceneIds || []) addEdge(`rule:${rule.id}`, `sceneTemplate:${sceneId}`, "applies-scene-template");
  }
  return edges;
}

function insertDocument(database, repoRoot, ownerType, ownerId, sourcePath) {
  if (!sourcePath) return;
  const exists = fs.existsSync(path.join(repoRoot, sourcePath));
  database.prepare("INSERT OR REPLACE INTO documents (id, owner_type, owner_id, path, source_exists, raw_json) VALUES (?, ?, ?, ?, ?, ?)").run(
    `${ownerType}:${ownerId}:${sourcePath}`,
    ownerType,
    ownerId,
    sourcePath,
    exists ? 1 : 0,
    stringify({ ownerType, ownerId, path: sourcePath, exists })
  );
}

function insertRef(database, table, leftColumn, leftValue, rightColumn, rightValue, rawValue) {
  if (!leftValue || !rightValue) return;
  database.prepare(`INSERT OR REPLACE INTO ${table} (${leftColumn}, ${rightColumn}, raw_json) VALUES (?, ?, ?)`).run(
    leftValue,
    rightValue,
    stringify(rawValue)
  );
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (key === "no-clear-current") {
      parsed["clear-current"] = false;
      continue;
    }
    parsed[key] = argv[index + 1];
    index += 1;
  }
  return parsed;
}

function stringify(value) {
  return JSON.stringify(value ?? null);
}
