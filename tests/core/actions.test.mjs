import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { runAction } from "../../src/core/actions.mjs";

test("runAction rejects unknown actions", async () => {
  const result = await runAction({
    rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url),
    actionId: "rm_rf",
    body: {}
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "unsupported_action");
});

test("create_minimal_profile_json refuses to overwrite existing files", async () => {
  const result = await runAction({
    rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url),
    actionId: "create_minimal_profile_json",
    body: {}
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "file_exists");
});

test("sync_project_entry requires a known project id", async () => {
  const result = await runAction({
    rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url),
    actionId: "sync_project_entry",
    body: { projectId: "../bad" }
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "invalid_project_id");
});

test("create_minimal_person_profile creates only the missing allowlisted file", async () => {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "context-studio-action-"));
  await fs.mkdir(path.join(rootDir, "docs/person"), { recursive: true });

  const result = await runAction({
    rootDir,
    actionId: "create_minimal_person_profile",
    body: {}
  });

  assert.equal(result.ok, true);
  assert.ok(result.changedPaths.includes("docs/person/profile.md"));
  assert.match(await fs.readFile(path.join(rootDir, "docs/person/profile.md"), "utf8"), /TODO/);
});

test("add_project_from_path scans project docs, skills, rules and writes relationships", async () => {
  const rootDir = await copyFixture();
  const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), "external-project-"));
  await fs.mkdir(path.join(projectDir, ".codex/skills/release-helper"), { recursive: true });
  await fs.mkdir(path.join(projectDir, ".cursor/rules"), { recursive: true });
  await fs.writeFile(path.join(projectDir, "AGENTS.md"), "# Payment App\n\nHandles payment callbacks.\n", "utf8");
  await fs.writeFile(path.join(projectDir, ".codex/skills/release-helper/SKILL.md"), "---\nname: release-helper\ndescription: Release helper skill.\n---\n# Release Helper\n", "utf8");
  await fs.writeFile(path.join(projectDir, ".cursor/rules/payment.mdc"), "# Payment Rule\n\nRead ai-context project config first.\n", "utf8");

  const result = await runAction({
    rootDir,
    actionId: "add_project_from_path",
    body: {
      projectPath: projectDir,
      projectId: "payment-app",
      name: "Payment App",
      technologyFamilyId: "bff"
    }
  });

  assert.equal(result.ok, true);
  assert.ok(result.changedPaths.includes("docs/repos/payment-app.md"));
  assert.ok(result.changedPaths.includes("config/projects/payment-app.json"));
  assert.ok(result.changedPaths.includes("bundles/skills/payment-app-release-helper/SKILL.md"));
  assert.ok(result.changedPaths.includes("bundles/rules/payment-app/payment.md"));

  const project = await readJson(path.join(rootDir, "config/projects/payment-app.json"));
  assert.equal(project.path, projectDir);
  assert.equal(project.skills[0].id, "payment-app-release-helper");
  assert.equal(project.rules[0].id, "payment-app/payment");

  const skills = await readJson(path.join(rootDir, "config/skills/skills.json"));
  assert.ok(skills.skills.some((skill) => skill.id === "payment-app-release-helper"));
  const rules = await readJson(path.join(rootDir, "config/rules/rules.json"));
  assert.ok(rules.rules.some((rule) => rule.id === "payment-app/payment" && rule.projectIds.includes("payment-app")));
});

test("add_scene creates scene docs and mounts it to projects", async () => {
  const rootDir = await copyFixture();

  const result = await runAction({
    rootDir,
    actionId: "add_scene",
    body: {
      sceneId: "payment-debug",
      name: "Payment Debug",
      projectIds: ["demo-project"],
      summary: "Debug payment failures."
    }
  });

  assert.equal(result.ok, true);
  const scene = await readJson(path.join(rootDir, "config/scenes/payment-debug.json"));
  assert.equal(scene.projects[0].id, "demo-project");
  const project = await readJson(path.join(rootDir, "config/projects/demo-project.json"));
  assert.ok(project.scenes.some((item) => item.id === "payment-debug"));
  assert.ok(result.changedPaths.includes("docs/scenes/payment-debug.md"));
});

test("add_skill_from_path copies skill and mounts it to selected projects", async () => {
  const rootDir = await copyFixture();
  const skillDir = await fs.mkdtemp(path.join(os.tmpdir(), "external-skill-"));
  await fs.writeFile(path.join(skillDir, "SKILL.md"), "---\nname: qa-helper\ndescription: QA helper skill.\n---\n# QA Helper\n", "utf8");

  const result = await runAction({
    rootDir,
    actionId: "add_skill_from_path",
    body: { skillPath: skillDir, skillId: "qa-helper", projectIds: ["demo-project"] }
  });

  assert.equal(result.ok, true);
  assert.ok(result.changedPaths.includes("bundles/skills/qa-helper/SKILL.md"));
  const project = await readJson(path.join(rootDir, "config/projects/demo-project.json"));
  assert.ok(project.skills.some((item) => item.id === "qa-helper"));
});

test("add_rule creates a rule file and mounts project plus scene relationships", async () => {
  const rootDir = await copyFixture();

  const result = await runAction({
    rootDir,
    actionId: "add_rule",
    body: {
      ruleId: "payment/safe-callback",
      name: "Payment Safe Callback",
      purpose: "Validate payment callback changes.",
      projectIds: ["demo-project"],
      sceneIds: ["demo-scene"],
      applyMode: "scene-on-demand"
    }
  });

  assert.equal(result.ok, true);
  assert.ok(result.changedPaths.includes("bundles/rules/payment/safe-callback.md"));
  const rules = await readJson(path.join(rootDir, "config/rules/rules.json"));
  assert.ok(rules.rules.some((rule) => rule.id === "payment/safe-callback" && rule.sceneIds.includes("demo-scene")));
  const scene = await readJson(path.join(rootDir, "config/scenes/demo-scene.json"));
  assert.ok(scene.rules.some((item) => item.id === "payment/safe-callback"));
});

async function copyFixture() {
  const source = new URL("./fixtures/basic-ai-context/", import.meta.url);
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "context-studio-fixture-"));
  await fs.cp(source, rootDir, { recursive: true });
  return rootDir;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}
