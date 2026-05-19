import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);

function makeRuntimeRoot() {
  const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-contextctl-"));
  fs.mkdirSync(path.join(runtimeRoot, "config/projects"), { recursive: true });
  fs.mkdirSync(path.join(runtimeRoot, "config/scenes"), { recursive: true });
  fs.mkdirSync(path.join(runtimeRoot, "config/tasks"), { recursive: true });
  fs.mkdirSync(path.join(runtimeRoot, "runtime/tasks"), { recursive: true });
  fs.writeFileSync(path.join(runtimeRoot, "config/projects/index.json"), JSON.stringify({ version: 1, projects: [] }, null, 2));
  fs.writeFileSync(path.join(runtimeRoot, "config/scenes/index.json"), JSON.stringify({ version: 1, scenes: [] }, null, 2));
  fs.copyFileSync(
    path.join(repoRoot, "config/tasks/gates.json"),
    path.join(runtimeRoot, "config/tasks/gates.json")
  );
  fs.writeFileSync(path.join(runtimeRoot, "runtime/current.json"), JSON.stringify({
    version: 1,
    activeTaskId: "",
    activeTaskPath: "",
    activeProjectIds: [],
    activeSceneIds: [],
    currentGate: "",
    recentTaskIds: [],
  }, null, 2));
  return runtimeRoot;
}

function runContextctl(runtimeRoot, args) {
  return execFileSync(process.execPath, [
    "scripts/contextctl.mjs",
    ...args,
  ], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DEVFLOW_ROOT_OVERRIDE: runtimeRoot,
    },
    stdio: "pipe",
  });
}

test("contextctl task start creates a gate workspace and records artifacts on the current gate", () => {
  const runtimeRoot = makeRuntimeRoot();
  const taskId = `tmp-task-${Date.now()}`;
  try {
    runContextctl(runtimeRoot, [
      "task",
      "start",
      "Temporary task",
      "--id",
      taskId,
      "--gate",
      "G3",
      "--artifact",
      "chat-design.md",
      "--force"
    ]);

    const task = JSON.parse(fs.readFileSync(path.join(runtimeRoot, "runtime/tasks", `${taskId}.json`), "utf8"));
    assert.ok(fs.statSync(path.join(runtimeRoot, "runtime/tasks", taskId, "G3")).isDirectory());
    assert.deepEqual(task.gates.find((gate) => gate.id === "G3").artifacts.map((item) => item.value), ["chat-design.md"]);
  } finally {
    fs.rmSync(runtimeRoot, { recursive: true, force: true });
  }
});

test("contextctl task artifact copies a project document into the selected gate", () => {
  const runtimeRoot = makeRuntimeRoot();
  const taskId = `tmp-artifact-${Date.now()}`;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-artifact-"));
  const sourceFile = path.join(tempDir, "openspec-design.md");
  fs.writeFileSync(sourceFile, "# Design\n");

  try {
    runContextctl(runtimeRoot, [
      "task",
      "start",
      "Temporary artifact task",
      "--id",
      taskId,
      "--gate",
      "G1",
      "--force"
    ]);

    runContextctl(runtimeRoot, [
      "task",
      "artifact",
      taskId,
      "--gate",
      "G3",
      "--file",
      sourceFile,
      "--note",
      "OpenSpec design copy"
    ]);

    const copiedPath = path.join(runtimeRoot, "runtime/tasks", taskId, "G3", "openspec-design.md");
    const task = JSON.parse(fs.readFileSync(path.join(runtimeRoot, "runtime/tasks", `${taskId}.json`), "utf8"));
    const artifact = task.gates.find((gate) => gate.id === "G3").artifacts[0];

    assert.equal(fs.readFileSync(copiedPath, "utf8"), "# Design\n");
    assert.equal(artifact.value, `runtime/tasks/${taskId}/G3/openspec-design.md`);
    assert.equal(artifact.sourcePath, sourceFile);
    assert.equal(artifact.note, "OpenSpec design copy");
  } finally {
    fs.rmSync(runtimeRoot, { recursive: true, force: true });
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
