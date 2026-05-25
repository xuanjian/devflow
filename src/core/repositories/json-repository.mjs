import fs from "node:fs/promises";
import path from "node:path";
import { normalizeSceneTemplate, normalizeWorkset } from "../contracts/devflow-types.mjs";
import { readJsonFile } from "../json-loader.mjs";
import { resolveInside, toPath } from "../paths.mjs";
import { assertRepositoryContract } from "./repository-contract.mjs";

export function createJsonRepository({ rootDir = process.cwd() } = {}) {
  const rootPath = toPath(rootDir);

  const repository = {
    async listProjects() {
      const index = await readData(rootPath, "config/projects/index.json", { projects: [] });
      return Promise.all((index.projects || []).map((item) => readProjectRecord(rootPath, item)));
    },

    async getProject(projectId) {
      const projects = await repository.listProjects();
      return projects.find((project) => project.id === projectId) || null;
    },

    async listSceneTemplates() {
      const index = await readData(rootPath, "config/scenes/index.json", { scenes: [] });
      const records = await Promise.all((index.scenes || []).map((item) => readSceneTemplateRecord(rootPath, item)));
      return records.map((record) => normalizeSceneTemplate(record));
    },

    async getSceneTemplate(sceneTemplateId) {
      const sceneTemplates = await repository.listSceneTemplates();
      return sceneTemplates.find((sceneTemplate) => sceneTemplate.id === sceneTemplateId) || null;
    },

    async listSkills() {
      const catalog = await readData(rootPath, "config/skills/skills.json", { skills: [] });
      return catalog.skills || [];
    },

    async listRules() {
      const catalog = await readData(rootPath, "config/rules/rules.json", { rules: [] });
      return catalog.rules || [];
    },

    async listTasks() {
      const taskPaths = await discoverTaskPaths(rootPath);
      const tasks = await Promise.all(taskPaths.map((taskPath) => readTaskRecord(rootPath, taskPath)));
      return tasks.filter(Boolean);
    },

    async getTask(taskId) {
      const directTask = await readTaskRecord(rootPath, `runtime/tasks/${taskId}.json`);
      if (directTask) {
        return directTask;
      }

      const tasks = await repository.listTasks();
      return tasks.find((task) => task.id === taskId) || null;
    },

    async getActiveTask() {
      const current = await readData(rootPath, "runtime/current.json", {});
      if (!current.activeTaskId) {
        return null;
      }
      return repository.getTask(current.activeTaskId);
    },

    async getWorkset(worksetOrTaskId) {
      const task = await repository.getTask(worksetOrTaskId);
      if (task?.workset) {
        return task.workset;
      }

      const tasks = await repository.listTasks();
      const taskByWorkset = tasks.find((item) => item.workset?.id === worksetOrTaskId);
      return taskByWorkset?.workset || null;
    },

    async listGraphEdges() {
      return buildGraphEdges({
        projects: await repository.listProjects(),
        sceneTemplates: await repository.listSceneTemplates(),
        rules: await repository.listRules(),
        tasks: await repository.listTasks()
      });
    },

    async writeProject(project) {
      const projectId = requireId(project, "project");
      await writeJson(rootPath, `config/projects/${projectId}.json`, project);
      await upsertIndexItem(rootPath, "config/projects/index.json", "projects", {
        id: projectId,
        name: project.name || projectId,
        technologyFamilyId: project.technologyFamilyId,
        path: `config/projects/${projectId}.json`,
        summary: project.summary || ""
      });
      return repository.getProject(projectId);
    },

    async writeSceneTemplate(sceneTemplate) {
      const sceneTemplateId = requireId(sceneTemplate, "sceneTemplate");
      const normalized = normalizeSceneTemplate(sceneTemplate);
      await writeJson(rootPath, `config/scenes/${sceneTemplateId}.json`, normalized);
      await upsertIndexItem(rootPath, "config/scenes/index.json", "scenes", {
        id: sceneTemplateId,
        name: normalized.name || sceneTemplateId,
        summary: normalized.summary || "",
        path: `config/scenes/${sceneTemplateId}.json`,
        sourcePath: normalized.sourcePath
      });
      return repository.getSceneTemplate(sceneTemplateId);
    },

    async writeTask(task) {
      const taskId = requireId(task, "task");
      const normalized = await normalizeTask(rootPath, task);
      await writeJson(rootPath, `runtime/tasks/${taskId}.json`, normalized);
      return repository.getTask(taskId);
    },

    async setRuntimeState(runtimeState) {
      const current = await readData(rootPath, "runtime/current.json", {});
      const nextState = { ...current, ...runtimeState };
      await writeJson(rootPath, "runtime/current.json", nextState);
      return nextState;
    }
  };

  return assertRepositoryContract(repository);
}

async function readProjectRecord(rootPath, indexItem) {
  const detailPath = indexItem.path || `config/projects/${indexItem.id}.json`;
  const detail = await readData(rootPath, detailPath, null);
  return { ...indexItem, ...(detail || {}), sourcePath: detailPath };
}

async function readSceneTemplateRecord(rootPath, indexItem) {
  const detailPath = indexItem.path || `config/scenes/${indexItem.id}.json`;
  const detail = await readData(rootPath, detailPath, null);
  return {
    ...indexItem,
    ...(detail || {}),
    sourcePath: detail?.sourcePath || detail?.source?.path || indexItem.sourcePath
  };
}

async function readTaskRecord(rootPath, taskPath) {
  const task = await readData(rootPath, taskPath, null);
  if (!task) {
    return null;
  }
  return normalizeTask(rootPath, task);
}

async function normalizeTask(rootPath, task) {
  const workset = task.workset ? normalizeWorkset(task.workset) : await buildLegacyWorkset(rootPath, task);
  const sceneTemplateId = task.sceneTemplateId || task.sceneTemplateIds?.[0] || task.sceneIds?.[0] || workset?.sceneTemplateId || "";
  const projectIds = task.projectIds?.length
    ? task.projectIds
    : (workset?.projects || []).map((project) => project.id).filter(Boolean);
  const sceneIds = task.sceneIds?.length ? task.sceneIds : (sceneTemplateId ? [sceneTemplateId] : []);

  return {
    ...task,
    currentGate: task.currentGate || task.gate || "",
    taskLevel: task.taskLevel || task.level || "",
    level: task.level || task.taskLevel || "",
    projectIds,
    sceneIds,
    sceneTemplateIds: task.sceneTemplateIds?.length ? task.sceneTemplateIds : sceneIds,
    workset
  };
}

async function buildLegacyWorkset(rootPath, task) {
  const sceneTemplateId = task.sceneIds?.[0];
  const sceneTemplates = await readAllSceneTemplateRecords(rootPath);
  const projects = await readAllProjectRecords(rootPath);
  const sceneTemplate = sceneTemplates.find((scene) => scene.id === sceneTemplateId);
  const matchedProjects = (task.projectIds || [])
    .map((projectId) => projects.find((project) => project.id === projectId) || { id: projectId })
    .filter(Boolean);

  return normalizeWorkset({
    id: `workset-${task.id}`,
    taskId: task.id,
    sourceText: task.title || task.summary || "",
    confidence: "legacy",
    reason: "Derived from legacy task projectIds and sceneIds.",
    sceneTemplateId,
    capabilities: uniqueRefs((sceneTemplate?.capabilityIds || []).map((id) => ({ id, role: "primary" }))),
    projects: uniqueRefs(matchedProjects.map((project) => ({ id: project.id, role: "primary" }))),
    skills: uniqueRefs([
      ...matchedProjects.flatMap((project) => project.skills || []),
      ...(sceneTemplate?.skillHints || [])
    ].map((skill) => ({ id: skill.id }))),
    rules: uniqueRefs([
      ...matchedProjects.flatMap((project) => project.rules || []),
      ...(sceneTemplate?.ruleHints || [])
    ].map((rule) => ({ id: rule.id })))
  });
}

async function readAllProjectRecords(rootPath) {
  const index = await readData(rootPath, "config/projects/index.json", { projects: [] });
  return Promise.all((index.projects || []).map((item) => readProjectRecord(rootPath, item)));
}

async function readAllSceneTemplateRecords(rootPath) {
  const index = await readData(rootPath, "config/scenes/index.json", { scenes: [] });
  const records = await Promise.all((index.scenes || []).map((item) => readSceneTemplateRecord(rootPath, item)));
  return records.map((record) => normalizeSceneTemplate(record));
}

async function discoverTaskPaths(rootPath) {
  const current = await readData(rootPath, "runtime/current.json", {});
  const taskPaths = [];
  const addPath = (taskPath) => {
    if (taskPath && !taskPaths.includes(taskPath)) {
      taskPaths.push(taskPath);
    }
  };

  addPath(current.activeTaskPath);
  for (const taskId of current.recentTaskIds || []) {
    addPath(`runtime/tasks/${taskId}.json`);
  }

  try {
    const entries = await fs.readdir(resolveInside(rootPath, "runtime/tasks"), { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".json")) {
        addPath(`runtime/tasks/${entry.name}`);
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  return taskPaths;
}

function buildGraphEdges({ projects, sceneTemplates, rules, tasks }) {
  const edges = [];
  const addEdge = (from, to, relation) => {
    if (!from || !to || edges.some((edge) => edge.from === from && edge.to === to && edge.relation === relation)) {
      return;
    }
    edges.push({ from, to, relation });
  };

  for (const project of projects) {
    for (const scene of project.scenes || []) addEdge(`project:${project.id}`, `sceneTemplate:${scene.id}`, "uses-scene-template");
    for (const skill of project.skills || []) addEdge(`project:${project.id}`, `skill:${skill.id}`, "uses-skill");
    for (const rule of project.rules || []) addEdge(`project:${project.id}`, `rule:${rule.id}`, "uses-rule");
  }

  for (const sceneTemplate of sceneTemplates) {
    for (const project of sceneTemplate.projectHints || []) addEdge(`sceneTemplate:${sceneTemplate.id}`, `project:${project.id}`, "hints-project");
    for (const skill of sceneTemplate.skillHints || []) addEdge(`sceneTemplate:${sceneTemplate.id}`, `skill:${skill.id}`, "hints-skill");
    for (const rule of sceneTemplate.ruleHints || []) addEdge(`sceneTemplate:${sceneTemplate.id}`, `rule:${rule.id}`, "hints-rule");
  }

  for (const rule of rules) {
    for (const projectId of rule.projectIds || []) addEdge(`rule:${rule.id}`, `project:${projectId}`, "applies-project");
    for (const sceneId of rule.sceneIds || []) addEdge(`rule:${rule.id}`, `sceneTemplate:${sceneId}`, "applies-scene-template");
  }

  for (const task of tasks) {
    for (const project of task.workset?.projects || []) addEdge(`task:${task.id}`, `project:${project.id}`, "workset-project");
    if (task.workset?.sceneTemplateId) {
      addEdge(`task:${task.id}`, `sceneTemplate:${task.workset.sceneTemplateId}`, "workset-scene-template");
    }
  }

  return edges;
}

async function upsertIndexItem(rootPath, indexPath, collectionName, item) {
  const index = await readData(rootPath, indexPath, { version: 1, [collectionName]: [] });
  const collection = index[collectionName] || [];
  const itemIndex = collection.findIndex((existing) => existing.id === item.id);
  if (itemIndex === -1) {
    collection.push(item);
  } else {
    collection[itemIndex] = { ...collection[itemIndex], ...item };
  }
  await writeJson(rootPath, indexPath, { ...index, [collectionName]: collection });
}

async function readData(rootPath, relativePath, fallback) {
  const result = await readJsonFile(resolveInside(rootPath, relativePath));
  if (result.ok) {
    return result.data;
  }
  return fallback;
}

async function writeJson(rootPath, relativePath, data) {
  const filePath = resolveInside(rootPath, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function requireId(record, entityType) {
  if (!record?.id) {
    throw new TypeError(`Cannot write ${entityType} without an id`);
  }
  return record.id;
}

function uniqueRefs(refs) {
  const seen = new Set();
  return refs.filter((ref) => {
    if (!ref?.id || seen.has(ref.id)) {
      return false;
    }
    seen.add(ref.id);
    return true;
  });
}
