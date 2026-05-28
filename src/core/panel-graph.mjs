import { buildGraph } from "./queries/graph-query.mjs";
import { GROUPS } from "./panel-graph/grouping.mjs";
import {
  addEdge,
  addMissingReferenceWarnings,
  addNode,
  addQueryNode,
  addTaskGateNodes,
  addWorksetNodes,
  buildDetails,
  materializeMissingReferenceNodes
} from "./panel-graph/node-builder.mjs";
import { addArtifactNodes, readGateCatalog, readProfileNode } from "./panel-graph/artifact-resolver.mjs";
import { toPath } from "./paths.mjs";

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
