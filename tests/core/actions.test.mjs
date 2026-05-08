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
