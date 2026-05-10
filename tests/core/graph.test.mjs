import test from "node:test";
import assert from "node:assert/strict";
import { buildContextGraph, getNodeDetails } from "../../src/core/graph.mjs";

test("buildContextGraph creates root groups and cross-links", async () => {
  const graph = await buildContextGraph({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url) });

  const root = graph.nodes.find((node) => node.id === "root:context-index");
  assert.ok(root);
  assert.equal(root.title, "上下文索引");
  assert.ok(graph.nodes.find((node) => node.id === "group:projects"));
  assert.ok(graph.nodes.find((node) => node.id === "group:scenes"));
  assert.ok(graph.nodes.find((node) => node.id === "group:skills"));
  assert.ok(graph.nodes.find((node) => node.id === "group:rules"));
  assert.ok(!graph.nodes.find((node) => node.id === "group:persona"));
  assert.ok(!graph.nodes.find((node) => node.id === "group:current-work"));
  assert.ok(graph.nodes.find((node) => node.id === "project:demo-project"));
  assert.ok(graph.nodes.find((node) => node.id === "scene:demo-scene"));
  assert.ok(graph.edges.find((edge) => edge.from === "project:demo-project" && edge.to === "scene:demo-scene"));
  assert.equal(graph.warnings.length, 0);
});

test("buildContextGraph warns when a project doc path is missing", async () => {
  const graph = await buildContextGraph({ rootDir: new URL("./fixtures/missing-doc-ai-context/", import.meta.url) });

  assert.ok(graph.warnings.some((warning) => warning.code === "missing_project_doc"));
});

test("getNodeDetails returns reverse relationships and documentation summary", async () => {
  const graph = await buildContextGraph({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url) });
  const details = getNodeDetails(graph, "project:demo-project");

  assert.equal(details.node.id, "project:demo-project");
  assert.match(details.documentationSummary, /demo project/i);
  assert.ok(details.related.scenes.some((node) => node.id === "scene:demo-scene"));
  assert.ok(details.related.skills.some((node) => node.id === "skill:demo-skill"));
  assert.ok(details.related.rules.some((node) => node.id === "rule:demo-rule"));
});

test("buildContextGraph exposes active task gates for task-board views", async () => {
  const graph = await buildContextGraph({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url) });

  assert.ok(graph.nodes.find((node) => node.id === "task:demo-task"));
  assert.ok(graph.nodes.find((node) => node.id === "gate:demo-task:G1"));
  assert.ok(graph.edges.find((edge) => edge.from === "task:demo-task" && edge.to === "gate:demo-task:G1" && edge.relation === "has-gate"));

  const details = getNodeDetails(graph, "task:demo-task");
  assert.ok(details.related.gates.some((node) => node.id === "gate:demo-task:G1"));
});
