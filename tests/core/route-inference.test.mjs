import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createDevFlowService } from "../../src/core/services/devflow-service.mjs";
import { createSqliteRepository } from "../../src/core/repositories/sqlite-repository.mjs";
import { seedSqliteFromJsonFixture } from "../helpers/sqlite-fixtures.mjs";

const basicFixtureRoot = new URL("./fixtures/basic-ai-context/", import.meta.url);

test("query route infers goods backend plus native ambiguity without pulling the full ordering frontend chain", async () => {
  const { service } = await createRoutingFixture();

  const route = await service.queryRoute({ text: "dhb-17828 商品限价 代客下单" });
  const candidateIds = route.candidates.map((candidate) => candidate.id);

  assert.equal(route.inference.product, "dhb");
  assert.ok(route.inference.domains.includes("goods"));
  assert.ok(candidateIds.includes("bff-goods"));
  assert.ok(candidateIds.includes("dhb"));
  assert.ok(candidateIds.includes("egg-business"));
  assert.ok(candidateIds.includes("egg-dhb-framework"));
  assert.ok(candidateIds.includes("egg-dhb-permission"));
  assert.equal(candidateIds.includes("dhbfront-cash-mini"), false);
  assert.equal(candidateIds.includes("dhb-mobile-index"), false);
  assert.equal(candidateIds.includes("new-mobile-h5"), false);
  assert.ok(route.candidates.find((candidate) => candidate.id === "bff-goods").reason.includes("domain:goods"));
  assert.ok(route.candidates.find((candidate) => candidate.id === "egg-business").reason.includes("depends-on"));
  assert.ok(route.clarify.some((item) => /订货端.*管理端|管理端.*订货端/.test(item.message)));
  assert.ok(route.historyHints.some((hint) => hint.taskId === "task-goods-limit" && hint.projectIds.includes("bff-goods")));
  assert.match(route.refinementHint, /规则候选/);
});

test("query route expands yorder frontend and bff candidates through chain and depends-on edges", async () => {
  const { service } = await createRoutingFixture();

  const route = await service.queryRoute({ text: "yorder 建议订单商品列表" });
  const candidateIds = route.candidates.map((candidate) => candidate.id);

  assert.ok(route.inference.domains.includes("order"));
  assert.ok(route.inference.domains.includes("goods"));
  for (const projectId of [
    "bff-order",
    "bff-goods",
    "dhb-packages",
    "dhbfront-cash-mini",
    "dhb-mobile-index",
    "new-mobile-h5",
    "dhb",
    "dhbfront-utils"
  ]) {
    assert.ok(candidateIds.includes(projectId), `missing ${projectId}`);
  }
  assert.ok(route.candidates.find((candidate) => candidate.id === "dhbfront-cash-mini").reason.includes("chain"));
  assert.ok(route.candidates.find((candidate) => candidate.id === "dhbfront-utils").reason.includes("depends-on"));
});

test("query route prunes a pure iOS task to native app candidates", async () => {
  const { service } = await createRoutingFixture();

  const route = await service.queryRoute({ text: "dhb iOS 修启动崩溃 只改 iOS" });
  const candidateIds = route.candidates.map((candidate) => candidate.id);

  assert.deepEqual(candidateIds, ["dhb"]);
  assert.deepEqual(route.workset.projects, [{ id: "dhb", role: "native" }]);
});

async function createRoutingFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-route-inference-"));
  fs.cpSync(basicFixtureRoot, root, { recursive: true });
  await seedSqliteFromJsonFixture(root);
  const repository = createSqliteRepository({ rootDir: root });

  for (const project of routingProjects()) {
    await repository.writeProject({ sourcePath: `config/projects/${project.id}.json`, ...project });
  }
  for (const edge of routingEdges()) {
    await repository.upsertGraphEdge(edge);
  }
  await repository.writeTask({
    id: "task-goods-limit",
    title: "商品限价代客下单修复",
    workset: {
      id: "workset-task-goods-limit",
      taskId: "task-goods-limit",
      projects: [{ id: "bff-goods" }, { id: "dhb" }]
    }
  });

  return {
    root,
    repository,
    service: createDevFlowService({ rootDir: root, repository })
  };
}

function routingProjects() {
  return [
    { id: "bff-goods", name: "bff-goods", products: ["dhb"], domains: ["goods"], role: "bff-service" },
    { id: "bff-order", name: "bff-order", products: ["dhb"], domains: ["order"], role: "bff-service" },
    { id: "egg-business", name: "egg-business", products: ["dhb"], domains: [], role: "bff-common" },
    { id: "egg-dhb-framework", name: "egg-dhb-framework", products: ["dhb"], domains: [], role: "bff-common" },
    { id: "egg-dhb-permission", name: "egg-dhb-permission", products: ["dhb"], domains: [], role: "bff-common" },
    { id: "dhb-packages", name: "dhb-packages", products: ["dhb"], domains: [], role: "subpackage" },
    { id: "dhbfront-cash-mini", name: "dhbfront-cash-mini", products: ["dhb"], domains: [], role: "main-package" },
    { id: "dhb-mobile-index", name: "dhb-mobile-index", products: ["dhb"], domains: [], role: "h5" },
    { id: "new-mobile-h5", name: "new-mobile-h5", products: ["dhb"], domains: [], role: "container" },
    { id: "customize-mini-program", name: "customize-mini-program", products: ["dhb"], domains: [], role: "mini-program" },
    { id: "dhb", name: "dhb", products: ["dhb"], domains: [], role: "native" },
    { id: "dhbfront-utils", name: "dhbfront-utils", products: ["dhb"], domains: [], role: "frontend-common" }
  ];
}

function routingEdges() {
  return [
    { from: "project:bff-goods", to: "project:egg-business", relation: "depends-on" },
    { from: "project:bff-goods", to: "project:egg-dhb-framework", relation: "depends-on" },
    { from: "project:bff-goods", to: "project:egg-dhb-permission", relation: "depends-on" },
    { from: "project:bff-order", to: "project:egg-business", relation: "depends-on" },
    { from: "project:bff-order", to: "project:egg-dhb-framework", relation: "depends-on" },
    { from: "project:bff-order", to: "project:egg-dhb-permission", relation: "depends-on" },
    { from: "project:dhb-packages", to: "project:dhbfront-cash-mini", relation: "chain" },
    { from: "project:dhbfront-cash-mini", to: "project:dhb-mobile-index", relation: "chain" },
    { from: "project:dhb-mobile-index", to: "project:new-mobile-h5", relation: "chain" },
    { from: "project:new-mobile-h5", to: "project:dhb", relation: "chain" },
    { from: "project:new-mobile-h5", to: "project:customize-mini-program", relation: "chain" },
    { from: "project:dhbfront-cash-mini", to: "project:dhbfront-utils", relation: "depends-on" },
    { from: "project:dhb-mobile-index", to: "project:dhbfront-utils", relation: "depends-on" },
    { from: "project:new-mobile-h5", to: "project:dhbfront-utils", relation: "depends-on" }
  ];
}
