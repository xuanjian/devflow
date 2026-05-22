import fs from "node:fs";
import path from "node:path";
import { normalizeCommandResult } from "../contracts/devflow-types.mjs";
import { createJsonRepository } from "../repositories/json-repository.mjs";
import { resolveInside, toPath } from "../paths.mjs";
import { defaultDbPath, initializeSchema, openDevFlowDatabase } from "./schema.mjs";

const TABLES_TO_CLEAR = [
  "graph_edges",
  "runtime_state",
  "task_events",
  "task_gates",
  "tasks",
  "workset_rules",
  "workset_skills",
  "workset_capabilities",
  "workset_projects",
  "worksets",
  "scene_template_rule_hints",
  "scene_template_skill_hints",
  "scene_template_project_hints",
  "scene_template_capabilities",
  "project_rule_mounts",
  "project_skill_mounts",
  "documents",
  "rules",
  "skills",
  "scene_templates",
  "capabilities",
  "projects"
];

export async function rebuildDevFlowIndex({ rootDir = process.cwd(), dbPath = defaultDbPath(rootDir) } = {}) {
  const rootPath = toPath(rootDir);
  const repository = createJsonRepository({ rootDir: rootPath });
  const db = openDevFlowDatabase({ rootDir: rootPath, dbPath });
  const warnings = [];

  try {
    initializeSchema(db);
    const [projects, sceneTemplates, skills, rules, tasks, edges] = await Promise.all([
      repository.listProjects(),
      repository.listSceneTemplates(),
      repository.listSkills(),
      repository.listRules(),
      repository.listTasks(),
      repository.listGraphEdges()
    ]);

    const current = readJson(rootPath, "runtime/current.json", {});
    const writeAll = db.transaction(() => {
      clearTables(db);
      insertProjects(db, rootPath, projects, warnings);
      insertSceneTemplates(db, rootPath, sceneTemplates, warnings);
      insertSkills(db, rootPath, skills, warnings);
      insertRules(db, rootPath, rules, warnings);
      insertTasks(db, tasks);
      insertRuntimeState(db, current);
      insertGraphEdges(db, edges);
    });
    writeAll();

    return normalizeCommandResult({
      status: "ok",
      action: "index rebuild",
      entityType: undefined,
      message: "SQLite index rebuilt.",
      paths: [path.relative(rootPath, dbPath).split(path.sep).join("/")],
      warnings
    });
  } finally {
    db.close();
  }
}

function clearTables(db) {
  for (const table of TABLES_TO_CLEAR) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
}

function insertProjects(db, rootPath, projects, warnings) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO projects (id, name, technology_family_id, source_path, doc_path, raw_json)
    VALUES (@id, @name, @technologyFamilyId, @sourcePath, @docPath, @rawJson)
  `);
  for (const project of projects) {
    insert.run({
      id: project.id,
      name: project.name || project.id,
      technologyFamilyId: project.technologyFamilyId || "",
      sourcePath: project.sourcePath || "",
      docPath: project.doc?.path || "",
      rawJson: stringify(project)
    });
    insertDocument(db, rootPath, warnings, "project", project.id, project.doc?.path);
    for (const skill of project.skills || []) insertRef(db, "project_skill_mounts", "project_id", project.id, "skill_id", skill.id, skill);
    for (const rule of project.rules || []) insertRef(db, "project_rule_mounts", "project_id", project.id, "rule_id", rule.id, rule);
  }
}

function insertSceneTemplates(db, rootPath, sceneTemplates, warnings) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO scene_templates (id, name, summary, source_path, raw_json)
    VALUES (@id, @name, @summary, @sourcePath, @rawJson)
  `);
  const insertCapability = db.prepare("INSERT OR REPLACE INTO capabilities (id, raw_json) VALUES (?, ?)");
  for (const sceneTemplate of sceneTemplates) {
    insert.run({
      id: sceneTemplate.id,
      name: sceneTemplate.name || sceneTemplate.id,
      summary: sceneTemplate.summary || "",
      sourcePath: sceneTemplate.sourcePath || "",
      rawJson: stringify(sceneTemplate)
    });
    insertDocument(db, rootPath, warnings, "sceneTemplate", sceneTemplate.id, sceneTemplate.sourcePath);
    for (const capabilityId of sceneTemplate.capabilityIds || []) {
      insertCapability.run(capabilityId, stringify({ id: capabilityId }));
      insertRef(db, "scene_template_capabilities", "scene_template_id", sceneTemplate.id, "capability_id", capabilityId, { id: capabilityId });
    }
    for (const project of sceneTemplate.projectHints || []) insertRef(db, "scene_template_project_hints", "scene_template_id", sceneTemplate.id, "project_id", project.id, project);
    for (const skill of sceneTemplate.skillHints || []) insertRef(db, "scene_template_skill_hints", "scene_template_id", sceneTemplate.id, "skill_id", skill.id, skill);
    for (const rule of sceneTemplate.ruleHints || []) insertRef(db, "scene_template_rule_hints", "scene_template_id", sceneTemplate.id, "rule_id", rule.id, rule);
  }
}

function insertSkills(db, rootPath, skills, warnings) {
  const insert = db.prepare("INSERT OR REPLACE INTO skills (id, name, source_path, raw_json) VALUES (@id, @name, @sourcePath, @rawJson)");
  for (const skill of skills) {
    insert.run({
      id: skill.id,
      name: skill.name || skill.id,
      sourcePath: skill.sourcePath || "",
      rawJson: stringify(skill)
    });
    insertDocument(db, rootPath, warnings, "skill", skill.id, skill.sourcePath);
  }
}

function insertRules(db, rootPath, rules, warnings) {
  const insert = db.prepare("INSERT OR REPLACE INTO rules (id, name, source_path, raw_json) VALUES (@id, @name, @sourcePath, @rawJson)");
  for (const rule of rules) {
    insert.run({
      id: rule.id,
      name: rule.name || rule.id,
      sourcePath: rule.sourcePath || "",
      rawJson: stringify(rule)
    });
    insertDocument(db, rootPath, warnings, "rule", rule.id, rule.sourcePath);
  }
}

function insertTasks(db, tasks) {
  const insertTask = db.prepare(`
    INSERT OR REPLACE INTO tasks (id, title, status, current_gate, workset_id, raw_json)
    VALUES (@id, @title, @status, @currentGate, @worksetId, @rawJson)
  `);
  const insertWorkset = db.prepare(`
    INSERT OR REPLACE INTO worksets (id, task_id, scene_template_id, confidence, reason, raw_json)
    VALUES (@id, @taskId, @sceneTemplateId, @confidence, @reason, @rawJson)
  `);
  const insertCapability = db.prepare("INSERT OR REPLACE INTO capabilities (id, raw_json) VALUES (?, ?)");
  const insertGate = db.prepare("INSERT OR REPLACE INTO task_gates (task_id, gate_id, status, raw_json) VALUES (?, ?, ?, ?)");
  const insertEvent = db.prepare("INSERT INTO task_events (task_id, event_type, raw_json) VALUES (?, ?, ?)");

  for (const task of tasks) {
    const workset = task.workset;
    insertTask.run({
      id: task.id,
      title: task.title || task.id,
      status: task.status || "",
      currentGate: task.currentGate || "",
      worksetId: workset?.id || "",
      rawJson: stringify(task)
    });
    for (const gate of task.gates || []) insertGate.run(task.id, gate.id, gate.status || "", stringify(gate));
    for (const note of task.notes || []) insertEvent.run(task.id, "note", stringify(note));
    for (const artifact of task.artifacts || []) insertEvent.run(task.id, "artifact", stringify(artifact));
    for (const blocker of task.blockers || []) insertEvent.run(task.id, "blocker", stringify(blocker));
    if (!workset) continue;
    insertWorkset.run({
      id: workset.id,
      taskId: workset.taskId || task.id,
      sceneTemplateId: workset.sceneTemplateId || "",
      confidence: workset.confidence || "",
      reason: workset.reason || "",
      rawJson: stringify(workset)
    });
    for (const capability of workset.capabilities || []) {
      insertCapability.run(capability.id, stringify(capability));
      insertRef(db, "workset_capabilities", "workset_id", workset.id, "capability_id", capability.id, capability);
    }
    for (const project of workset.projects || []) insertRef(db, "workset_projects", "workset_id", workset.id, "project_id", project.id, project);
    for (const skill of workset.skills || []) insertRef(db, "workset_skills", "workset_id", workset.id, "skill_id", skill.id, skill);
    for (const rule of workset.rules || []) insertRef(db, "workset_rules", "workset_id", workset.id, "rule_id", rule.id, rule);
  }
}

function insertRuntimeState(db, current) {
  db.prepare("INSERT OR REPLACE INTO runtime_state (key, raw_json) VALUES (?, ?)").run("current", stringify(current));
}

function insertGraphEdges(db, edges) {
  const insert = db.prepare("INSERT OR REPLACE INTO graph_edges (from_id, to_id, relation, raw_json) VALUES (?, ?, ?, ?)");
  for (const edge of edges) {
    insert.run(edge.from, edge.to, edge.relation, stringify(edge));
  }
}

function insertRef(db, table, leftColumn, leftValue, rightColumn, rightValue, rawValue) {
  if (!leftValue || !rightValue) return;
  db.prepare(`INSERT OR REPLACE INTO ${table} (${leftColumn}, ${rightColumn}, raw_json) VALUES (?, ?, ?)`).run(
    leftValue,
    rightValue,
    stringify(rawValue)
  );
}

function insertDocument(db, rootPath, warnings, ownerType, ownerId, sourcePath) {
  if (!sourcePath) return;
  const exists = fs.existsSync(resolveInside(rootPath, sourcePath));
  if (!exists) {
    warnings.push({
      code: "missing_source_path",
      ownerType,
      ownerId,
      path: sourcePath
    });
  }
  db.prepare("INSERT OR REPLACE INTO documents (id, owner_type, owner_id, path, source_exists, raw_json) VALUES (?, ?, ?, ?, ?, ?)").run(
    `${ownerType}:${ownerId}:${sourcePath}`,
    ownerType,
    ownerId,
    sourcePath,
    exists ? 1 : 0,
    stringify({ ownerType, ownerId, path: sourcePath, exists })
  );
}

function readJson(rootPath, relativePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(resolveInside(rootPath, relativePath), "utf8"));
  } catch {
    return fallback;
  }
}

function stringify(value) {
  return JSON.stringify(value ?? null);
}
