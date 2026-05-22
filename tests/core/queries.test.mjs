import test from "node:test";
import assert from "node:assert/strict";
import { createDevFlowService } from "../../src/core/services/devflow-service.mjs";

test("queryRoute returns the locked route shape with workset and readPaths", async () => {
  const repository = createFakeRepository();
  const service = createDevFlowService({ rootDir: "/tmp/devflow", repository });

  const route = await service.queryRoute({ text: "修 demo project" });

  assert.equal(route.type, "route");
  assert.equal(route.mode, "light");
  assert.equal(route.sceneTemplate.id, "demo-scene");
  assert.equal(route.sceneTemplate.templateType, "scene-template");
  assert.equal(route.sceneTemplate.confidence, "medium");
  assert.equal(route.workset.id, "workset-route-demo-scene");
  assert.equal(route.workset.sceneTemplateId, "demo-scene");
  assert.deepEqual(route.workset.projects, [{ id: "demo-project", role: "primary" }]);
  assert.deepEqual(route.skills.map((skill) => skill.id), ["demo-skill"]);
  assert.deepEqual(route.rules.map((rule) => rule.id), ["demo-rule"]);
  assert.ok(route.readPaths.includes("config/projects/demo-project.json"));
  assert.ok(route.readPaths.includes("README.md"));
  assert.match(route.nextAction, /Inspect selected project context/i);
});

test("queryCurrent recovers active task, workset, nextAction, and recoveryPoint", async () => {
  const repository = createFakeRepository();
  const service = createDevFlowService({ rootDir: "/tmp/devflow", repository });

  const current = await service.queryCurrent();

  assert.equal(current.type, "current");
  assert.equal(current.task.id, "demo-task");
  assert.equal(current.workset.id, "workset-demo-task");
  assert.equal(current.nextAction, "Continue G2 discovery.");
  assert.equal(current.recoveryPoint, "Open the implementation plan and continue from Task 3.");
});

test("querySkills and queryRules filter by project, template, and workset/task id", async () => {
  const repository = createFakeRepository();
  const service = createDevFlowService({ rootDir: "/tmp/devflow", repository });

  assert.deepEqual((await service.querySkills({ projectId: "demo-project" })).skills.map((skill) => skill.id), ["demo-skill"]);
  assert.deepEqual((await service.querySkills({ templateId: "demo-scene" })).skills.map((skill) => skill.id), ["demo-skill"]);
  assert.deepEqual((await service.querySkills({ worksetId: "workset-demo-task" })).skills.map((skill) => skill.id), ["demo-skill"]);
  assert.deepEqual((await service.querySkills({ worksetId: "demo-task" })).skills.map((skill) => skill.id), ["demo-skill"]);

  assert.deepEqual((await service.queryRules({ projectId: "demo-project" })).rules.map((rule) => rule.id), ["demo-rule"]);
  assert.deepEqual((await service.queryRules({ templateId: "demo-scene" })).rules.map((rule) => rule.id), ["demo-rule"]);
  assert.deepEqual((await service.queryRules({ worksetId: "workset-demo-task" })).rules.map((rule) => rule.id), ["demo-rule"]);
  assert.deepEqual((await service.queryRules({ worksetId: "demo-task" })).rules.map((rule) => rule.id), ["demo-rule"]);

  assert.deepEqual((await service.querySkills({ worksetId: "workset-floating" })).skills.map((skill) => skill.id), ["floating-skill"]);
  assert.deepEqual((await service.queryRules({ worksetId: "workset-floating" })).rules.map((rule) => rule.id), ["floating-rule"]);
});

test("buildGraph returns repository graph edges with entity nodes", async () => {
  const repository = createFakeRepository();
  const service = createDevFlowService({ rootDir: "/tmp/devflow", repository });

  const graph = await service.buildGraph();

  assert.equal(graph.type, "graph");
  assert.ok(graph.nodes.some((node) => node.id === "project:demo-project"));
  assert.ok(graph.nodes.some((node) => node.id === "sceneTemplate:demo-scene"));
  assert.ok(graph.edges.some((edge) => edge.from === "project:demo-project" && edge.to === "sceneTemplate:demo-scene"));
});

function createFakeRepository() {
  const projects = [
    {
      id: "demo-project",
      name: "Demo Project",
      summary: "Demo project for routing.",
      path: ".",
      sourcePath: "config/projects/demo-project.json",
      doc: { path: "README.md" }
    },
    {
      id: "other-project",
      name: "Other Project",
      summary: "Unmatched project.",
      path: "other",
      sourcePath: "config/projects/other-project.json"
    }
  ];
  const sceneTemplates = [
    {
      id: "demo-scene",
      templateType: "scene-template",
      name: "Demo Scene",
      summary: "Repair demo project workflows.",
      capabilityIds: ["task-routing"],
      projectHints: [{ id: "demo-project", role: "primary" }],
      skillHints: [{ id: "demo-skill" }],
      ruleHints: [{ id: "demo-rule" }],
      sourcePath: "config/scenes/demo-scene.json"
    }
  ];
  const skills = [
    {
      id: "demo-skill",
      projectIds: ["demo-project"],
      templateIds: ["demo-scene"],
      worksetIds: ["workset-demo-task"],
      sourcePath: "bundles/skills/demo/SKILL.md"
    },
    { id: "floating-skill" },
    { id: "other-skill", projectIds: ["other-project"] }
  ];
  const rules = [
    {
      id: "demo-rule",
      projectIds: ["demo-project"],
      templateIds: ["demo-scene"],
      worksetIds: ["workset-demo-task"],
      sourcePath: "bundles/rules/demo.md"
    },
    { id: "floating-rule" },
    { id: "other-rule", projectIds: ["other-project"] }
  ];
  const activeTask = {
    id: "demo-task",
    title: "Demo task",
    nextAction: "Continue G2 discovery.",
    recoveryPoint: "Open the implementation plan and continue from Task 3.",
    workset: {
      id: "workset-demo-task",
      taskId: "demo-task",
      sourceText: "修 demo project",
      confidence: "high",
      sceneTemplateId: "demo-scene",
      projects: [{ id: "demo-project", role: "primary" }],
      skills: [{ id: "demo-skill" }],
      rules: [{ id: "demo-rule" }]
    }
  };

  return {
    async listProjects() {
      return projects;
    },
    async getProject(projectId) {
      return projects.find((project) => project.id === projectId) || null;
    },
    async listSceneTemplates() {
      return sceneTemplates;
    },
    async getSceneTemplate(templateId) {
      return sceneTemplates.find((template) => template.id === templateId) || null;
    },
    async listSkills() {
      return skills;
    },
    async listRules() {
      return rules;
    },
    async listTasks() {
      return [activeTask];
    },
    async getTask(taskId) {
      return taskId === activeTask.id ? activeTask : null;
    },
    async getActiveTask() {
      return activeTask;
    },
    async getWorkset(worksetId) {
      if (worksetId === "workset-floating") {
        return {
          id: "workset-floating",
          skills: [{ id: "floating-skill" }],
          rules: [{ id: "floating-rule" }]
        };
      }
      return worksetId === activeTask.workset.id || worksetId === activeTask.id ? activeTask.workset : null;
    },
    async listGraphEdges() {
      return [{ from: "project:demo-project", to: "sceneTemplate:demo-scene", relation: "uses-template" }];
    },
    async writeProject(project) {
      projects.push(project);
      return project;
    },
    async writeSceneTemplate(template) {
      sceneTemplates.push(template);
      return template;
    },
    async writeTask(task) {
      return task;
    },
    async setRuntimeState() {}
  };
}
