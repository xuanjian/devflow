import fs from "node:fs/promises";
import path from "node:path";
import { readJsonFile } from "./json-loader.mjs";
import { resolveInside, toPath } from "./paths.mjs";
import { summarizeMarkdown } from "./markdown.mjs";

const GROUPS = [
  { id: "group:projects", type: "group", title: "Projects", summary: "Configured projects" },
  { id: "group:scenes", type: "group", title: "Scenes", summary: "Workflow scenes" },
  { id: "group:skills", type: "group", title: "Skills", summary: "Mounted skills" },
  { id: "group:rules", type: "group", title: "Rules", summary: "Active rules" }
];

export async function buildContextGraph({ rootDir = process.cwd() } = {}) {
  const rootPath = toPath(rootDir);
  const graph = {
    nodes: [],
    edges: [],
    groups: GROUPS.map(({ id, title }) => ({ id, title })),
    warnings: [],
    detailsById: {}
  };

  addNode(graph, {
    id: "root:context-index",
    type: "root",
    title: "上下文索引",
    summary: "Project, scene, skill, rule, profile, and task index",
    status: "ok"
  });
  for (const group of GROUPS) {
    addNode(graph, { ...group, status: "ok" });
    addEdge(graph, "root:context-index", group.id, "contains", "system");
  }

  const [projectsIndex, scenesIndex, skillsCatalog, rulesCatalog, profileJson, currentJson] = await Promise.all([
    readJsonFile(resolveInside(rootPath, "config/projects/index.json")),
    readJsonFile(resolveInside(rootPath, "config/scenes/index.json")),
    readJsonFile(resolveInside(rootPath, "config/skills/skills.json")),
    readJsonFile(resolveInside(rootPath, "config/rules/rules.json")),
    readJsonFile(resolveInside(rootPath, "config/profile.json")),
    readJsonFile(resolveInside(rootPath, "runtime/current.json"))
  ]);

  collectReadWarnings(graph, [projectsIndex, scenesIndex, skillsCatalog, rulesCatalog, profileJson, currentJson]);

  const projectIds = new Set();
  const sceneIds = new Set();
  const skillIds = new Set();
  const ruleIds = new Set();

  for (const item of projectsIndex.data?.projects || []) {
    const detail = await readJsonFile(resolveInside(rootPath, item.path || `config/projects/${item.id}.json`));
    if (!detail.ok) {
      addWarning(graph, "missing_project_detail", `Project detail missing for ${item.id}`, item.path);
    }
    const project = detail.ok ? detail.data : item;
    const nodeId = `project:${item.id}`;
    projectIds.add(item.id);

    const docPath = project?.doc?.path;
    const docSummary = await readOptionalMarkdown(rootPath, docPath);
    const status = docPath && !docSummary.exists ? "warning" : "ok";
    if (docPath && !docSummary.exists) {
      addWarning(graph, "missing_project_doc", `Project doc missing for ${item.id}: ${docPath}`, docPath, nodeId);
    }

    addNode(graph, {
      id: nodeId,
      type: "project",
      title: project.name || item.name || item.id,
      summary: project.summary || item.summary || "",
      sourcePath: item.path,
      docPath,
      documentationSummary: docSummary.summary,
      status,
      raw: project
    });
    addEdge(graph, "group:projects", nodeId, "contains", "config/projects/index.json");

    for (const scene of project.scenes || []) {
      addEdge(graph, nodeId, `scene:${scene.id}`, "uses-scene", item.path);
    }
    for (const skill of project.skills || []) {
      addEdge(graph, nodeId, `skill:${skill.id}`, "uses-skill", item.path);
    }
    for (const rule of project.rules || []) {
      addEdge(graph, nodeId, `rule:${rule.id}`, "uses-rule", item.path);
    }
  }

  for (const item of scenesIndex.data?.scenes || []) {
    const detail = await readJsonFile(resolveInside(rootPath, item.path || `config/scenes/${item.id}.json`));
    if (!detail.ok) {
      addWarning(graph, "missing_scene_detail", `Scene detail missing for ${item.id}`, item.path);
    }
    const scene = detail.ok ? detail.data : item;
    const nodeId = `scene:${item.id}`;
    sceneIds.add(item.id);

    addNode(graph, {
      id: nodeId,
      type: "scene",
      title: scene.name || item.name || item.id,
      summary: scene.summary || item.summary || "",
      sourcePath: item.path,
      docPath: scene.source?.path || item.sourcePath,
      status: "ok",
      raw: scene
    });
    addEdge(graph, "group:scenes", nodeId, "contains", "config/scenes/index.json");

    for (const project of scene.projects || []) {
      addEdge(graph, nodeId, `project:${project.id}`, "includes-project", item.path);
    }
    for (const rule of scene.rules || []) {
      addEdge(graph, nodeId, `rule:${rule.id}`, "uses-rule", item.path);
    }
  }

  for (const skill of skillsCatalog.data?.skills || []) {
    skillIds.add(skill.id);
    addNode(graph, {
      id: `skill:${skill.id}`,
      type: "skill",
      title: skill.name || skill.id,
      summary: skill.description || skill.trigger || "",
      sourcePath: skill.sourcePath,
      status: (await existsAt(rootPath, skill.sourcePath)) ? "ok" : "warning",
      raw: skill
    });
    addEdge(graph, "group:skills", `skill:${skill.id}`, "contains", "config/skills/skills.json");
  }

  for (const rule of rulesCatalog.data?.rules || []) {
    ruleIds.add(rule.id);
    addNode(graph, {
      id: `rule:${rule.id}`,
      type: "rule",
      title: rule.name || rule.id,
      summary: rule.purpose || rule.whenToRead || "",
      sourcePath: rule.sourcePath,
      status: (await existsAt(rootPath, rule.sourcePath)) ? "ok" : "warning",
      raw: rule
    });
    addEdge(graph, "group:rules", `rule:${rule.id}`, "contains", "config/rules/rules.json");
    for (const projectId of rule.projectIds || []) {
      addEdge(graph, `rule:${rule.id}`, `project:${projectId}`, "applies-project", "config/rules/rules.json");
    }
    for (const sceneId of rule.sceneIds || []) {
      addEdge(graph, `rule:${rule.id}`, `scene:${sceneId}`, "applies-scene", "config/rules/rules.json");
    }
  }

  const profileSource = profileJson.data?.sourcePath || "docs/person/profile.md";
  const profileDoc = await readOptionalMarkdown(rootPath, profileSource);
  addNode(graph, {
    id: "profile:main",
    type: "profile",
    title: "Persona Profile",
    summary: profileJson.data?.role || "Persona and collaboration profile",
    sourcePath: "config/profile.json",
    docPath: profileSource,
    documentationSummary: profileDoc.summary,
    status: profileJson.ok && profileDoc.exists ? "ok" : "warning",
    raw: profileJson.data
  });

  const taskPaths = await discoverTaskPaths(rootPath, currentJson.data);
  for (const taskPath of taskPaths) {
    const task = await readJsonFile(resolveInside(rootPath, taskPath));
    const taskData = task.ok ? task.data : taskPath === currentJson.data?.activeTaskPath ? currentJson.data : null;
    const taskIdValue = taskData?.id || path.basename(taskPath, ".json");
    if (!taskData || !taskIdValue) {
      addWarning(graph, "missing_task_detail", `Task detail missing for ${taskPath}`, taskPath);
      continue;
    }

    const isActive = taskIdValue === currentJson.data?.activeTaskId;
    const nodeId = `task:${taskIdValue}`;
    const taskRaw = {
      ...taskData,
      currentGate: taskData.currentGate || (isActive ? currentJson.data?.currentGate : undefined),
      isActive,
      taskPath
    };

    addNode(graph, {
      id: nodeId,
      type: "task",
      title: taskData.title || taskIdValue,
      summary: taskData.summary || (isActive ? currentJson.data?.note : "") || "",
      sourcePath: taskPath,
      status: task.ok ? "ok" : "warning",
      raw: taskRaw
    });

    for (const gate of taskData.gates || []) {
      const gateNodeId = `gate:${taskIdValue}:${gate.id}`;
      addNode(graph, {
        id: gateNodeId,
        type: "gate",
        title: `${gate.id} ${gate.name || ""}`.trim(),
        summary: gate.purpose || "",
        sourcePath: taskPath,
        status: statusForGate(gate.status),
        raw: { ...gate, taskId: taskIdValue }
      });
      addEdge(graph, nodeId, gateNodeId, "has-gate", taskPath);
    }

    const projectRefs = taskData.projectIds || (isActive ? currentJson.data?.activeProjectIds : []) || [];
    const sceneRefs = taskData.sceneIds || (isActive ? currentJson.data?.activeSceneIds : []) || [];
    for (const projectId of projectRefs) {
      addEdge(graph, nodeId, `project:${projectId}`, isActive ? "active-project" : "task-project", taskPath);
    }
    for (const sceneId of sceneRefs) {
      addEdge(graph, nodeId, `scene:${sceneId}`, isActive ? "active-scene" : "task-scene", taskPath);
    }
  }

  addMissingReferenceWarnings(graph, { projectIds, sceneIds, skillIds, ruleIds });
  buildDetails(graph);
  return graph;
}

export function getNodeDetails(graph, nodeId) {
  return graph.detailsById?.[nodeId] || null;
}

function addNode(graph, node) {
  const existing = graph.nodes.find((item) => item.id === node.id);
  if (existing) {
    Object.assign(existing, { ...node, status: mergeStatus(existing.status, node.status) });
    return existing;
  }
  graph.nodes.push({ status: "unknown", summary: "", ...node });
  return node;
}

function addEdge(graph, from, to, relation, source) {
  if (!from || !to || graph.edges.some((edge) => edge.from === from && edge.to === to && edge.relation === relation)) {
    return;
  }
  graph.edges.push({ from, to, relation, source });
}

function addWarning(graph, code, message, sourcePath, nodeId) {
  graph.warnings.push({ code, message, sourcePath, nodeId });
}

function collectReadWarnings(graph, results) {
  for (const result of results) {
    if (!result.ok) {
      addWarning(graph, result.error.code, result.error.message, result.path);
    }
  }
}

async function readOptionalMarkdown(rootPath, relativePath) {
  if (!relativePath) {
    return { exists: false, summary: "" };
  }
  try {
    const raw = await fs.readFile(resolveInside(rootPath, relativePath), "utf8");
    return { exists: true, summary: summarizeMarkdown(raw) };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { exists: false, summary: "" };
    }
    return { exists: false, summary: error.message };
  }
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

async function discoverTaskPaths(rootPath, currentData = {}) {
  const paths = [];
  const addPath = (relativePath) => {
    if (relativePath && !paths.includes(relativePath)) {
      paths.push(relativePath);
    }
  };

  addPath(currentData?.activeTaskPath);
  for (const taskId of currentData?.recentTaskIds || []) {
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

  return paths;
}

function buildDetails(graph) {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const node of graph.nodes) {
    const relatedIds = new Set();
    for (const edge of graph.edges) {
      if (edge.from === node.id) relatedIds.add(edge.to);
      if (edge.to === node.id) relatedIds.add(edge.from);
    }
    const relatedNodes = [...relatedIds].map((id) => nodesById.get(id)).filter(Boolean);
    graph.detailsById[node.id] = {
      node,
      documentationSummary: node.documentationSummary || "",
      related: {
        projects: relatedNodes.filter((item) => item.type === "project"),
        scenes: relatedNodes.filter((item) => item.type === "scene"),
        skills: relatedNodes.filter((item) => item.type === "skill"),
        rules: relatedNodes.filter((item) => item.type === "rule"),
        gates: relatedNodes.filter((item) => item.type === "gate"),
        profiles: relatedNodes.filter((item) => item.type === "profile"),
        tasks: relatedNodes.filter((item) => item.type === "task")
      },
      warnings: graph.warnings.filter((warning) => warning.nodeId === node.id || warning.sourcePath === node.sourcePath || warning.sourcePath === node.docPath),
      actions: []
    };
  }
}

function addMissingReferenceWarnings(graph, ids) {
  const known = new Set([
    ...[...ids.projectIds].map((id) => `project:${id}`),
    ...[...ids.sceneIds].map((id) => `scene:${id}`),
    ...[...ids.skillIds].map((id) => `skill:${id}`),
    ...[...ids.ruleIds].map((id) => `rule:${id}`),
    ...GROUPS.map((group) => group.id),
    "root:context-index",
    "profile:main"
  ]);
  for (const edge of graph.edges) {
    if (!known.has(edge.from) && !edge.from.startsWith("task:") && !edge.from.startsWith("gate:")) {
      addWarning(graph, "missing_graph_reference", `Missing graph node referenced by edge: ${edge.from}`, edge.source);
    }
    if (!known.has(edge.to) && !edge.to.startsWith("task:") && !edge.to.startsWith("gate:")) {
      addWarning(graph, "missing_graph_reference", `Missing graph node referenced by edge: ${edge.to}`, edge.source);
    }
  }
}

function statusForGate(status) {
  if (status === "done") return "ok";
  if (status === "blocked") return "warning";
  if (status === "failed") return "missing";
  return status ? "warning" : "unknown";
}

function mergeStatus(left, right) {
  const order = { missing: 3, warning: 2, unknown: 1, ok: 0 };
  return order[right] > order[left] ? right : left;
}
