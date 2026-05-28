import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { seedSqliteFromJsonFixture } from "../helpers/sqlite-fixtures.mjs";

const testFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(testFile), "../..");
const cliPath = path.join(repoRoot, "scripts/devflow-cli.mjs");
const fixtureRoot = path.join(repoRoot, "tests/core/fixtures/basic-ai-context");

function copyFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-cli-task-"));
  fs.cpSync(fixtureRoot, root, { recursive: true });
  return root;
}

function runScript(scriptPath, rootDir, args) {
  return spawnSync(process.execPath, [scriptPath, "--root", rootDir, ...args], {
    cwd: repoRoot,
    env: { ...process.env },
    encoding: "utf8"
  });
}

function parseJson(result) {
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("devflow task start and update write task state through the CLI facade", async () => {
  const root = copyFixture();
  await seedSqliteFromJsonFixture(root);
  const start = parseJson(runScript(cliPath, root, [
    "task",
    "start",
    "demo task",
    "--id",
    "cli-demo-task",
    "--project",
    "demo-project",
    "--template",
    "demo-scene",
    "--gate",
    "G1",
    "--note",
    "started"
  ]));
  const update = parseJson(runScript(cliPath, root, [
    "task",
    "update",
    "cli-demo-task",
    "--gate",
    "G4",
    "--note",
    "progress"
  ]));
  const current = parseJson(runScript(cliPath, root, ["task", "current"]));

  assert.equal(start.status, "ok");
  assert.equal(start.action, "startTask");
  assert.equal(update.status, "ok");
  assert.equal(update.action, "updateTask");
  assert.equal(current.task.id, "cli-demo-task");
  assert.equal(current.task.currentGate || current.task.gate, "G4");
  assert.equal(current.workset.sceneTemplateId, "demo-scene");
  assert.equal(current.workset.projects[0].id, "demo-project");
  assert.equal(fs.existsSync(path.join(root, "runtime/tasks/cli-demo-task.json")), false);
  assert.equal(fs.existsSync(path.join(root, "runtime/tasks/cli-demo-task/handoff.md")), true);
});
