import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runChecks } from "../../src/core/checks.mjs";

const testDir = path.dirname(fileURLToPath(import.meta.url));

async function copyFixture(name) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "devflow-checks-"));
  await fs.cp(path.join(testDir, "fixtures", name), root, { recursive: true });
  return root;
}

test("runChecks reports profile, optional panel app, and project docs as structured checks", async () => {
  const rootDir = await copyFixture("basic-ai-context");
  try {
    const result = await runChecks({ rootDir, runCommands: false });

    assert.ok(result.checks.find((check) => check.id === "panel_app_resolved" && check.status === "pass"));
    assert.ok(result.checks.find((check) => check.id === "profile_json" && check.status === "pass"));
    assert.ok(result.checks.find((check) => check.id === "person_profile_doc" && check.status === "pass"));
    assert.ok(result.checks.find((check) => check.id === "project_docs" && check.status === "pass"));
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("runChecks marks missing persona files as repairable failures", async () => {
  const rootDir = await copyFixture("missing-profile-ai-context");
  try {
    const result = await runChecks({ rootDir, runCommands: false });

    assert.ok(result.checks.find((check) => check.id === "profile_json" && check.actionId === "create_minimal_profile_json"));
    assert.ok(result.checks.find((check) => check.id === "person_profile_doc" && check.actionId === "create_minimal_person_profile"));
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});

test("runChecks reports active task, graph references, script commands, skill links, and project entry drift", async () => {
  const rootDir = await copyFixture("basic-ai-context");
  try {
    const result = await runChecks({ rootDir, runCommands: false });
    const ids = new Set(result.checks.map((check) => check.id));

    assert.equal(ids.has("active_task_path"), true);
    assert.equal(ids.has("graph_references"), true);
    assert.equal(ids.has("install_command"), true);
    assert.equal(ids.has("install_check_command"), true);
    assert.equal(ids.has("install_validate_command"), true);
    assert.equal(ids.has("ai_context_skill_links"), true);
    assert.equal(ids.has("project_entry_sync_drift"), true);
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true });
  }
});
