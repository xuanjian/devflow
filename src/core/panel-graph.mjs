import fs from "node:fs/promises";
import path from "node:path";
import { buildGraph } from "./queries/graph-query.mjs";
import { resolveInside, toPath } from "./paths.mjs";
import { summarizeMarkdown } from "./markdown.mjs";

const GROUPS = [
  { id: "group:projects", type: "group", title: "Projects", summary: "Configured projects" },
  { id: "group:sceneTemplates", type: "group", title: "Scene Templates", summary: "Reusable routing templates" },
  { id: "group:skills", type: "group", title: "Skills", summary: "Mounted skills" },
  { id: "group:rules", type: "group", title: "Rules", summary: "Active rules" }
];

const GROUP_BY_TYPE = {
  project: "group:projects",
  sceneTemplate: "group:sceneTemplates",
  skill: "group:skills",
  rule: "group:rules"
};

const DEFAULT_GATES = [
  { id: "G1", name: "Intent / Intake", purpose: "记录用户目标、任务类型、任务等级、是否需要完整 G1-G7，以及是否触发 OpenSpec 规格层。" },
  { id: "G2", name: "Discovery", purpose: "记录调研过程中选中的项目、场景、规则、skill、证据来源、未知项，并把调研结论交给 G3。" },
  { id: "G3", name: "Plan / Product UI", purpose: "记录产品、UI、技术方案或交互原型，并把可执行边界交给 G4。" },
  { id: "G4", name: "Development", purpose: "记录当前开发项目、写入范围、验证预期和恢复位置。" },
  { id: "G5", name: "Integration", purpose: "记录单项目运行、跨项目联调、环境切换、阻塞项和联调证据。" },
  { id: "G6", name: "Acceptance", purpose: "记录对照需求、UI、接口、diff 和测试结果的验收状态。" },
  { id: "G7", name: "Run / Package Archive", purpose: "记录运行、测试、打包、最终验证、归档和交接说明。" }
];

export async function buildPanelGraph(repository, { rootDir = process.cwd() } = {}) {
  const rootPath = toPath(rootDir);
  const [queryGraph, activeTask, profile, gateCatalog] = await Promise.all([
    buildGraph(repository),
    repository.getActiveTask(),
    readProfileNode(rootPath),
    readGateCatalog(rootPath)
  ]);

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
    summary: "Project, scene-template, skill, rule, profile, task, and Workset index",
    status: "ok"
  });
  for (const group of GROUPS) {
    addNode(graph, { ...group, status: "ok" });
    addEdge(graph, "root:context-index", group.id, "contains", "system");
  }

  for (const node of queryGraph.nodes || []) {
    addQueryNode(graph, node, activeTask?.id);
  }
  for (const edge of queryGraph.edges || []) {
    addEdge(graph, edge.from, edge.to, edge.relation, edge.source || "repository");
  }

  addWorksetNodes(graph);
  addTaskGateNodes(graph, gateCatalog);
  await addArtifactNodes(graph, rootPath, gateCatalog);
  materializeMissingReferenceNodes(graph);
  if (profile) {
    addNode(graph, profile);
  }

  addMissingReferenceWarnings(graph);
  buildDetails(graph);
  return graph;
}

export function getPanelNodeDetails(graph, nodeId) {
  return graph.detailsById?.[nodeId] || null;
}

function addQueryNode(graph, node, activeTaskId) {
  const raw = node.type === "task" ? normalizeTaskRaw(node.raw || {}) : (node.raw || {});
  const status = statusForNode({ ...node, raw }, activeTaskId);
  const panelNode = {
    id: node.id,
    type: node.type,
    title: node.title || raw.name || raw.title || raw.id || node.id,
    summary: raw.summary || raw.description || raw.trigger || raw.note || "",
    sourcePath: sourcePathForNode(node),
    docPath: raw.doc?.path || raw.sourcePath || "",
    status,
    raw: node.type === "task" ? { ...raw, isActive: raw.id === activeTaskId } : raw
  };
  addNode(graph, panelNode);

  const groupId = GROUP_BY_TYPE[node.type];
  if (groupId) {
    addEdge(graph, groupId, node.id, "contains", "repository");
  }
}

function normalizeTaskRaw(task) {
  const workset = task.workset || null;
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
    sceneTemplateIds: task.sceneTemplateIds?.length ? task.sceneTemplateIds : sceneIds
  };
}

function sourcePathForNode(node) {
  const raw = node.raw || {};
  if (raw.sourcePath || raw.path || raw.taskPath || raw.paths?.handoff) {
    return raw.sourcePath || raw.path || raw.taskPath || raw.paths?.handoff;
  }
  if (node.type === "task" && raw.id) {
    return `runtime/tasks/${raw.id}/handoff.md`;
  }
  return "";
}

function addWorksetNodes(graph) {
  const taskNodes = graph.nodes.filter((node) => node.type === "task");
  for (const task of taskNodes) {
    const workset = task.raw?.workset;
    if (!workset?.id) continue;
    const worksetNodeId = `workset:${workset.id}`;
    addNode(graph, {
      id: worksetNodeId,
      type: "workset",
      title: workset.id,
      summary: workset.reason || workset.sourceText || "",
      status: "ok",
      raw: workset
    });
    addEdge(graph, task.id, worksetNodeId, "has-workset", "repository");
    if (workset.sceneTemplateId) {
      addEdge(graph, worksetNodeId, `sceneTemplate:${workset.sceneTemplateId}`, "loads-scene-template", "workset");
    }
    for (const project of workset.projects || []) {
      addEdge(graph, worksetNodeId, `project:${project.id}`, "loads-project", "workset");
    }
    for (const skill of workset.skills || []) {
      addEdge(graph, worksetNodeId, `skill:${skill.id}`, "loads-skill", "workset");
    }
    for (const rule of workset.rules || []) {
      addEdge(graph, worksetNodeId, `rule:${rule.id}`, "loads-rule", "workset");
    }
  }
}

function addTaskGateNodes(graph, gateCatalog) {
  const taskNodes = graph.nodes.filter((node) => node.type === "task");
  for (const task of taskNodes) {
    for (const gate of gatesForTask(task.raw, gateCatalog)) {
      const gateNodeId = `gate:${task.raw.id || task.id.slice("task:".length)}:${gate.id}`;
      addNode(graph, {
        id: gateNodeId,
        type: "gate",
        title: `${gate.id} ${gate.name || ""}`.trim(),
        summary: gate.purpose || gate.summary || "",
        sourcePath: task.sourcePath,
        status: statusForGate(gate.status),
        raw: { ...gate, taskId: task.raw.id }
      });
      addEdge(graph, task.id, gateNodeId, "has-gate", task.sourcePath || "repository");
    }
  }
}

async function addArtifactNodes(graph, rootPath, gateCatalog) {
  const taskNodes = graph.nodes.filter((node) => node.type === "task");
  for (const task of taskNodes) {
    const taskId = task.raw?.id || task.id.slice("task:".length);
    const taskDir = `runtime/tasks/${taskId}`;
    const handoffPath = task.raw?.paths?.handoff || `${taskDir}/handoff.md`;
    await addArtifactPath(graph, rootPath, task, null, handoffPath, { kind: "handoff" });
    await addReferencedArtifactsFromMarkdown(graph, rootPath, task, null, handoffPath, gateCatalog);

    const gateArtifactPaths = await discoverGateArtifactPaths(rootPath, taskDir);
    for (const artifactPath of gateArtifactPaths) {
      const gateId = gateIdFromArtifactPath(artifactPath);
      const gateNode = graph.nodes.find((node) => node.id === `gate:${taskId}:${gateId}`) || null;
      await addArtifactPath(graph, rootPath, task, gateNode, artifactPath, { kind: "gate-artifacts" });
      await addReferencedArtifactsFromMarkdown(graph, rootPath, task, gateNode, artifactPath, gateCatalog);
    }
  }
}

async function addArtifactPath(graph, rootPath, task, gate, artifactPath, raw = {}) {
  if (!artifactPath) return null;
  const normalizedPath = normalizeArtifactPath(artifactPath);
  if (!normalizedPath) return null;
  const exists = await pathExists(rootPath, normalizedPath);
  const summary = await readArtifactSummary(rootPath, normalizedPath, exists);
  const nodeId = artifactNodeId(normalizedPath);
  const node = addNode(graph, {
    id: nodeId,
    type: "artifact",
    title: artifactTitle(normalizedPath, raw.label),
    summary,
    sourcePath: normalizedPath,
    docPath: normalizedPath.endsWith(".md") ? normalizedPath : "",
    status: exists ? "ok" : "warning",
    raw: {
      id: normalizedPath,
      path: normalizedPath,
      sourceExists: exists,
      taskId: task.raw?.id || task.id.slice("task:".length),
      gateId: gate?.raw?.id || "",
      ...raw
    }
  });
  addEdge(graph, task.id, node.id, "has-artifact", task.sourcePath || "task");
  if (gate) {
    addEdge(graph, gate.id, node.id, "produced-artifact", gate.sourcePath || "gate");
  }
  return node;
}

async function addReferencedArtifactsFromMarkdown(graph, rootPath, task, gate, artifactPath, gateCatalog) {
  const markdown = await readText(rootPath, artifactPath);
  if (!markdown) return;
  for (const artifact of extractArtifactReferences(markdown, rootPath)) {
    const artifactGate = artifact.gateId
      ? ensureTaskGateNode(graph, task, artifact.gateId, gateCatalog) || gate
      : gate;
    await addArtifactPath(graph, rootPath, task, artifactGate, artifact.path, {
      kind: "referenced-artifact",
      label: artifact.label,
      inferredGateId: artifact.gateId || artifactGate?.raw?.id || "",
      sourceArtifactPath: artifactPath
    });
  }
}

function ensureTaskGateNode(graph, task, gateId, gateCatalog) {
  if (!gateId) return null;
  const taskId = task.raw?.id || task.id.slice("task:".length);
  const gateNodeId = `gate:${taskId}:${gateId}`;
  const existing = graph.nodes.find((node) => node.id === gateNodeId);
  if (existing) return existing;
  const catalogGate = gateCatalog.find((gate) => gate.id === gateId) || { id: gateId, name: gateId };
  const gateNode = addNode(graph, {
    id: gateNodeId,
    type: "gate",
    title: `${catalogGate.id} ${catalogGate.name || ""}`.trim(),
    summary: catalogGate.purpose || catalogGate.summary || "",
    sourcePath: task.sourcePath,
    status: "unknown",
    raw: { ...catalogGate, taskId }
  });
  addEdge(graph, task.id, gateNode.id, "has-gate", task.sourcePath || "repository");
  return gateNode;
}

async function discoverGateArtifactPaths(rootPath, taskDir) {
  const absoluteTaskDir = resolveInside(rootPath, taskDir);
  let entries;
  try {
    entries = await fs.readdir(absoluteTaskDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const paths = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^G\d+$/i.test(entry.name)) continue;
    const relativePath = `${taskDir}/${entry.name}/artifacts.md`;
    if (await pathExists(rootPath, relativePath)) {
      paths.push(relativePath);
    }
  }
  return paths.sort();
}

function gateIdFromArtifactPath(artifactPath) {
  return String(artifactPath).split("/").find((segment) => /^G\d+$/i.test(segment)) || "";
}

function extractArtifactReferences(markdown, rootPath) {
  const refs = new Map();
  let inFence = false;
  let inArtifactSection = false;
  let currentHeading = "";
  for (const line of String(markdown || "").split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^\s*#+\s+/.test(line)) {
      currentHeading = line.replace(/^\s*#+\s+/, "").trim();
      inArtifactSection = /artifact|产物/i.test(currentHeading);
    }

    const candidates = [];
    if (/^\s*\|/.test(line)) {
      for (const cell of line.split("|").slice(1, -1)) {
        candidates.push(cell);
      }
    } else if (inArtifactSection && /^\s*[-*]\s+/.test(line)) {
      candidates.push(line.replace(/^\s*[-*]\s+/, ""));
    }

    for (const candidate of candidates) {
      for (const artifactPath of extractPathCandidates(candidate, rootPath)) {
        const label = artifactTitle(artifactPath);
        refs.set(artifactPath, {
          path: artifactPath,
          label,
          gateId: inferArtifactGateId({ path: artifactPath, label, context: `${currentHeading} ${candidate}` })
        });
      }
    }
  }
  return [...refs.values()];
}

function inferArtifactGateId({ path: artifactPath, label, context }) {
  const text = `${artifactPath || ""} ${label || ""} ${context || ""}`.toLowerCase();
  if (/product[-_ ]?plan|technical[-_ ]?design|design|方案|技术方案|产品方案|实现计划|plan/.test(text)) {
    return "G3";
  }
  if (/discovery|research|evidence|investigation|调研|证据|接口响应|curl|样例|验证/.test(text)) {
    return "G2";
  }
  if (/acceptance|验收|测试结果|test-result|verification/.test(text)) {
    return "G6";
  }
  if (/runbook|deploy|package|archive|发布|部署|归档|打包/.test(text)) {
    return "G7";
  }
  return "";
}

function extractPathCandidates(value, rootPath) {
  const normalized = stripMarkdown(value);
  const candidates = [];
  const absoluteMatches = [...normalized.matchAll(/\/Users\/[^|]+/g)];
  for (const match of absoluteMatches) {
    const candidate = normalizeArtifactPath(match[0], rootPath);
    if (candidate && !candidate.includes("<task-id>")) candidates.push(candidate);
  }
  let withoutAbsolutePaths = normalized;
  for (const match of absoluteMatches) {
    withoutAbsolutePaths = withoutAbsolutePaths.replace(match[0], " ");
  }
  for (const match of withoutAbsolutePaths.matchAll(/\b(?:runtime\/tasks|docs|src|apps|tests|config|scripts)\/[^\s|，,]+/g)) {
    const candidate = normalizeArtifactPath(match[0], rootPath);
    if (candidate && !candidate.includes("<task-id>")) candidates.push(candidate);
  }
  return candidates;
}

function normalizeArtifactPath(value, rootPath = "") {
  const raw = stripMarkdown(value);
  const startIndex = firstPathIndex(raw);
  if (startIndex === -1) return "";
  const normalized = raw
    .slice(startIndex)
    .replace(/[。；;，,）)\]]+$/g, "")
    .trim();
  const rootPrefix = rootPath ? `${toPath(rootPath)}/` : "";
  return rootPrefix && normalized.startsWith(rootPrefix) ? normalized.slice(rootPrefix.length) : normalized;
}

function firstPathIndex(value) {
  const indexes = [
    value.indexOf("/Users/"),
    value.indexOf("runtime/tasks/"),
    value.indexOf("docs/"),
    value.indexOf("src/"),
    value.indexOf("apps/"),
    value.indexOf("tests/"),
    value.indexOf("config/"),
    value.indexOf("scripts/")
  ].filter((index) => index >= 0);
  return indexes.length ? Math.min(...indexes) : -1;
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/<([^>]+)>/g, "$1")
    .replace(/^.*?→\s*/, "")
    .trim();
}

function artifactNodeId(artifactPath) {
  return `artifact:${encodeURIComponent(artifactPath)}`;
}

function artifactTitle(artifactPath, fallback = "") {
  if (fallback) return fallback;
  const normalized = String(artifactPath || "").replace(/\/$/, "");
  return path.basename(normalized) || normalized || "artifact";
}

async function readArtifactSummary(rootPath, artifactPath, exists) {
  if (!exists || !artifactPath.endsWith(".md")) {
    return artifactPath;
  }
  const raw = await readText(rootPath, artifactPath);
  return raw ? summarizeMarkdown(raw) : artifactPath;
}

async function readText(rootPath, artifactPath) {
  if (!artifactPath) return "";
  try {
    return await fs.readFile(absoluteArtifactPath(rootPath, artifactPath), "utf8");
  } catch {
    return "";
  }
}

async function pathExists(rootPath, artifactPath) {
  try {
    await fs.access(absoluteArtifactPath(rootPath, artifactPath));
    return true;
  } catch {
    return false;
  }
}

function absoluteArtifactPath(rootPath, artifactPath) {
  return path.isAbsolute(artifactPath) ? artifactPath : resolveInside(rootPath, artifactPath);
}

function gatesForTask(task, gateCatalog) {
  if (task?.gates?.length) {
    return task.gates;
  }
  if (!task?.currentGate && !task?.gate) {
    return [];
  }
  const currentGate = task.currentGate || task.gate;
  return gateCatalog.map((gate) => ({
    ...gate,
    status: statusForDefaultGate(gate.id, currentGate)
  }));
}

function statusForDefaultGate(gateId, currentGate) {
  const gateNumber = Number(String(gateId).replace(/^G/i, ""));
  const currentNumber = Number(String(currentGate).replace(/^G/i, ""));
  if (!gateNumber || !currentNumber) return "";
  if (gateNumber < currentNumber) return "done";
  if (gateNumber === currentNumber) return "in_progress";
  return "";
}

function materializeMissingReferenceNodes(graph) {
  let changed = false;
  do {
    changed = false;
    const known = new Set(graph.nodes.map((node) => node.id));
    for (const edge of graph.edges) {
      for (const nodeId of [edge.from, edge.to]) {
        if (known.has(nodeId)) continue;
        const placeholder = placeholderNodeFor(nodeId, edge.source);
        if (!placeholder) continue;
        addNode(graph, placeholder);
        const groupId = GROUP_BY_TYPE[placeholder.type];
        if (groupId) {
          addEdge(graph, groupId, nodeId, "contains", placeholder.sourcePath || "placeholder");
        }
        addWarning(graph, "placeholder_reference", `Reference has no indexed metadata: ${nodeId}`, placeholder.sourcePath, nodeId);
        changed = true;
      }
    }
  } while (changed);
}

function placeholderNodeFor(nodeId, sourcePath) {
  const [type, ...rest] = String(nodeId).split(":");
  const id = rest.join(":");
  if (!id || !["project", "sceneTemplate", "skill", "rule"].includes(type)) {
    return null;
  }
  return {
    id: nodeId,
    type,
    title: id,
    summary: "Referenced by migrated task or Workset; metadata is not present in the SQLite index.",
    sourcePath: sourcePath || "repository",
    status: "warning",
    raw: { id, placeholder: true }
  };
}

async function readProfileNode(rootPath) {
  let profile;
  try {
    profile = JSON.parse(await fs.readFile(resolveInside(rootPath, "config/profile.json"), "utf8"));
  } catch {
    return null;
  }
  const sourcePath = profile.sourcePath || "docs/person/profile.md";
  const document = await readOptionalMarkdown(rootPath, sourcePath);
  return {
    id: "profile:main",
    type: "profile",
    title: "Persona Profile",
    summary: profile.role || "Persona and collaboration profile",
    sourcePath: "config/profile.json",
    docPath: sourcePath,
    documentationSummary: document.summary,
    status: document.exists ? "ok" : "warning",
    raw: profile
  };
}

async function readGateCatalog(rootPath) {
  try {
    const catalog = JSON.parse(await fs.readFile(resolveInside(rootPath, "config/tasks/gates.json"), "utf8"));
    return catalog.gates?.length ? catalog.gates : DEFAULT_GATES;
  } catch {
    return DEFAULT_GATES;
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

function addMissingReferenceWarnings(graph) {
  const known = new Set(graph.nodes.map((node) => node.id));
  for (const edge of graph.edges) {
    if (!known.has(edge.from)) {
      addWarning(graph, "missing_graph_reference", `Missing graph node referenced by edge: ${edge.from}`, edge.source);
    }
    if (!known.has(edge.to)) {
      addWarning(graph, "missing_graph_reference", `Missing graph node referenced by edge: ${edge.to}`, edge.source);
    }
  }
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
        scenes: relatedNodes.filter((item) => item.type === "sceneTemplate"),
        sceneTemplates: relatedNodes.filter((item) => item.type === "sceneTemplate"),
        skills: relatedNodes.filter((item) => item.type === "skill"),
        rules: relatedNodes.filter((item) => item.type === "rule"),
        gates: relatedNodes.filter((item) => item.type === "gate"),
        profiles: relatedNodes.filter((item) => item.type === "profile"),
        tasks: relatedNodes.filter((item) => item.type === "task"),
        worksets: relatedNodes.filter((item) => item.type === "workset"),
        artifacts: relatedNodes.filter((item) => item.type === "artifact")
      },
      warnings: graph.warnings.filter((warning) => warning.nodeId === node.id || warning.sourcePath === node.sourcePath || warning.sourcePath === node.docPath),
      actions: []
    };
  }
}

function statusForNode(node, activeTaskId) {
  if (node.type === "task") {
    if (node.raw?.status === "blocked") return "warning";
    if (node.raw?.status === "failed") return "missing";
    return node.raw?.id === activeTaskId ? "warning" : "ok";
  }
  if (node.raw?.sourceExists === false) return "warning";
  return node.status || "ok";
}

function statusForGate(status) {
  if (status === "done") return "ok";
  if (status === "blocked") return "warning";
  if (status === "failed") return "missing";
  return status ? "warning" : "unknown";
}

function mergeStatus(left, right) {
  const order = { missing: 3, warning: 2, unknown: 1, ok: 0, pass: 0 };
  return (order[right] || 0) > (order[left] || 0) ? right : left;
}
