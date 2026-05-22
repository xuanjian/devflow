import { normalizeSceneTemplate, normalizeWorkset } from "../contracts/devflow-types.mjs";
import { assertRepositoryContract } from "./repository-contract.mjs";
import { defaultDbPath, initializeSchema, openDevFlowDatabase } from "../storage/schema.mjs";

export function createSqliteRepository({ rootDir = process.cwd(), dbPath = defaultDbPath(rootDir) } = {}) {
  const db = openDevFlowDatabase({ rootDir, dbPath });
  initializeSchema(db);

  const repository = {
    async listProjects() {
      return listRaw(db, "projects");
    },

    async getProject(projectId) {
      return getRaw(db, "projects", projectId);
    },

    async listSceneTemplates() {
      return listRaw(db, "scene_templates").map((sceneTemplate) => normalizeSceneTemplate(sceneTemplate));
    },

    async getSceneTemplate(sceneTemplateId) {
      const sceneTemplate = getRaw(db, "scene_templates", sceneTemplateId);
      return sceneTemplate ? normalizeSceneTemplate(sceneTemplate) : null;
    },

    async listSkills() {
      return listRaw(db, "skills");
    },

    async listRules() {
      return listRaw(db, "rules");
    },

    async listTasks() {
      return listRaw(db, "tasks").map((task) => normalizeTask(task));
    },

    async getTask(taskId) {
      const task = getRaw(db, "tasks", taskId);
      return task ? normalizeTask(task) : null;
    },

    async getActiveTask() {
      const current = getRuntimeState(db);
      if (!current?.activeTaskId) return null;
      return repository.getTask(current.activeTaskId);
    },

    async getWorkset(worksetOrTaskId) {
      const task = await repository.getTask(worksetOrTaskId);
      if (task?.workset) return task.workset;
      const workset = getRaw(db, "worksets", worksetOrTaskId);
      return workset ? normalizeWorkset(workset) : null;
    },

    async listGraphEdges() {
      return listRaw(db, "graph_edges");
    },

    async writeProject(project) {
      upsertProject(db, project);
      return repository.getProject(project.id);
    },

    async writeSceneTemplate(sceneTemplate) {
      const normalized = normalizeSceneTemplate(sceneTemplate);
      upsertSceneTemplate(db, normalized);
      return repository.getSceneTemplate(normalized.id);
    },

    async writeTask(task) {
      upsertTask(db, normalizeTask(task));
      return repository.getTask(task.id);
    },

    async setRuntimeState(runtimeState) {
      const current = getRuntimeState(db) || {};
      const nextState = { ...current, ...runtimeState };
      db.prepare("INSERT OR REPLACE INTO runtime_state (key, raw_json) VALUES (?, ?)").run("current", stringify(nextState));
      return nextState;
    }
  };

  return assertRepositoryContract(repository);
}

function listRaw(db, table) {
  return db.prepare(`SELECT raw_json FROM ${table} ORDER BY rowid`).all().map((row) => parseRaw(row.raw_json));
}

function getRaw(db, table, id) {
  const row = db.prepare(`SELECT raw_json FROM ${table} WHERE id = ?`).get(id);
  return row ? parseRaw(row.raw_json) : null;
}

function getRuntimeState(db) {
  const row = db.prepare("SELECT raw_json FROM runtime_state WHERE key = ?").get("current");
  return row ? parseRaw(row.raw_json) : null;
}

function normalizeTask(task) {
  return task?.workset ? { ...task, workset: normalizeWorkset(task.workset) } : task;
}

function upsertProject(db, project) {
  if (!project?.id) throw new TypeError("Cannot write project without an id");
  db.prepare(`
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
}

function upsertSceneTemplate(db, sceneTemplate) {
  if (!sceneTemplate?.id) throw new TypeError("Cannot write sceneTemplate without an id");
  db.prepare(`
    INSERT OR REPLACE INTO scene_templates (id, name, summary, source_path, raw_json)
    VALUES (@id, @name, @summary, @sourcePath, @rawJson)
  `).run({
    id: sceneTemplate.id,
    name: sceneTemplate.name || sceneTemplate.id,
    summary: sceneTemplate.summary || "",
    sourcePath: sceneTemplate.sourcePath || "",
    rawJson: stringify(sceneTemplate)
  });
}

function upsertTask(db, task) {
  if (!task?.id) throw new TypeError("Cannot write task without an id");
  const workset = task.workset ? normalizeWorkset(task.workset) : null;
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT OR REPLACE INTO tasks (id, title, status, current_gate, workset_id, raw_json)
      VALUES (@id, @title, @status, @currentGate, @worksetId, @rawJson)
    `).run({
      id: task.id,
      title: task.title || task.id,
      status: task.status || "",
      currentGate: task.currentGate || task.gate || "",
      worksetId: workset?.id || "",
      rawJson: stringify(workset ? { ...task, workset } : task)
    });
    if (workset) upsertWorkset(db, workset);
  });
  tx();
}

function upsertWorkset(db, workset) {
  db.prepare(`
    INSERT OR REPLACE INTO worksets (id, task_id, scene_template_id, confidence, reason, raw_json)
    VALUES (@id, @taskId, @sceneTemplateId, @confidence, @reason, @rawJson)
  `).run({
    id: workset.id,
    taskId: workset.taskId || "",
    sceneTemplateId: workset.sceneTemplateId || "",
    confidence: workset.confidence || "",
    reason: workset.reason || "",
    rawJson: stringify(workset)
  });

  clearWorksetRefs(db, workset.id);
  for (const capability of workset.capabilities || []) insertRef(db, "workset_capabilities", "workset_id", workset.id, "capability_id", capability.id, capability);
  for (const project of workset.projects || []) insertRef(db, "workset_projects", "workset_id", workset.id, "project_id", project.id, project);
  for (const skill of workset.skills || []) insertRef(db, "workset_skills", "workset_id", workset.id, "skill_id", skill.id, skill);
  for (const rule of workset.rules || []) insertRef(db, "workset_rules", "workset_id", workset.id, "rule_id", rule.id, rule);
}

function clearWorksetRefs(db, worksetId) {
  for (const table of ["workset_capabilities", "workset_projects", "workset_skills", "workset_rules"]) {
    db.prepare(`DELETE FROM ${table} WHERE workset_id = ?`).run(worksetId);
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

function parseRaw(value) {
  return JSON.parse(value);
}

function stringify(value) {
  return JSON.stringify(value ?? null);
}
