import test from "node:test";
import assert from "node:assert/strict";
import { runChecks } from "../../src/core/checks.mjs";

test("runChecks reports profile, Vite app, and project docs as structured checks", async () => {
  const result = await runChecks({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url), runCommands: false });

  assert.ok(result.checks.find((check) => check.id === "vite_app_resolved" && check.status === "pass"));
  assert.ok(result.checks.find((check) => check.id === "profile_json" && check.status === "pass"));
  assert.ok(result.checks.find((check) => check.id === "person_profile_doc" && check.status === "pass"));
  assert.ok(result.checks.find((check) => check.id === "project_docs" && check.status === "pass"));
});

test("runChecks marks missing persona files as repairable failures", async () => {
  const result = await runChecks({ rootDir: new URL("./fixtures/missing-profile-ai-context/", import.meta.url), runCommands: false });

  assert.ok(result.checks.find((check) => check.id === "profile_json" && check.actionId === "create_minimal_profile_json"));
  assert.ok(result.checks.find((check) => check.id === "person_profile_doc" && check.actionId === "create_minimal_person_profile"));
});

test("runChecks reports active task, graph references, script commands, skill links, and project entry drift", async () => {
  const result = await runChecks({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url), runCommands: false });
  const ids = new Set(result.checks.map((check) => check.id));

  assert.equal(ids.has("active_task_path"), true);
  assert.equal(ids.has("graph_references"), true);
  assert.equal(ids.has("install_command"), true);
  assert.equal(ids.has("install_check_command"), true);
  assert.equal(ids.has("install_validate_command"), true);
  assert.equal(ids.has("ai_context_skill_links"), true);
  assert.equal(ids.has("project_entry_sync_drift"), true);
});
