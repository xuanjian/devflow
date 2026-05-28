import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULT_ENTRY, ENTRY_CONFIG_KEY } from "../../../src/core/defaults/entry.mjs";
import { DEFAULT_PROFILE, PROFILE_CONFIG_KEY } from "../../../src/core/defaults/profile.mjs";
import { DEFAULT_GATES, GATES_CONFIG_KEY } from "../../../src/core/defaults/gates.mjs";
import { createSqliteRepository } from "../../../src/core/repositories/sqlite-repository.mjs";

function createRepository() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-sqlite-config-"));
  return createSqliteRepository({ rootDir, dbPath: path.join(rootDir, "data/devflow.db") });
}

test("getConfig returns null for unknown keys", async () => {
  const repository = createRepository();

  assert.equal(typeof repository.getConfig, "function");
  assert.equal(await repository.getConfig("unknown"), null);
});

test("setConfig and getConfig round-trip JSON values", async () => {
  const repository = createRepository();
  const value = { version: 1, nested: { enabled: true }, items: ["a", "b"] };

  assert.equal(typeof repository.setConfig, "function");
  assert.deepEqual(await repository.setConfig("demo", value), value);
  assert.deepEqual(await repository.getConfig("demo"), value);
});

test("entry profile and gates getters fall back to default constants", async () => {
  const repository = createRepository();

  assert.deepEqual(await repository.getEntry(), DEFAULT_ENTRY);
  assert.deepEqual(await repository.getProfile(), DEFAULT_PROFILE);
  assert.deepEqual(await repository.getGates(), DEFAULT_GATES);
});

test("entry profile and gates getters prefer config table values", async () => {
  const repository = createRepository();
  const entry = { version: 99, name: "custom entry" };
  const profile = { version: 99, name: "custom profile" };
  const gates = { version: 99, gates: [{ id: "GX" }] };

  await repository.setConfig(ENTRY_CONFIG_KEY, entry);
  await repository.setConfig(PROFILE_CONFIG_KEY, profile);
  await repository.setConfig(GATES_CONFIG_KEY, gates);

  assert.deepEqual(await repository.getEntry(), entry);
  assert.deepEqual(await repository.getProfile(), profile);
  assert.deepEqual(await repository.getGates(), gates);
});

test("writeTaskDocument and listTaskDocuments round-trip documents", async () => {
  const repository = createRepository();
  const first = {
    kind: "handoff",
    path: "runtime/tasks/demo-task/handoff.md",
    summary: "Task handoff.",
    generatedAt: "2026-05-28T00:00:00.000Z"
  };
  const second = {
    kind: "artifact",
    path: "runtime/tasks/demo-task/G1/artifacts.md",
    summary: "G1 artifacts.",
    generatedAt: "2026-05-28T00:00:01.000Z"
  };

  assert.equal(typeof repository.writeTaskDocument, "function");
  assert.equal(typeof repository.listTaskDocuments, "function");
  assert.deepEqual(await repository.writeTaskDocument("demo-task", first), first);
  assert.deepEqual(await repository.writeTaskDocument("demo-task", second), second);

  assert.deepEqual(await repository.listTaskDocuments("demo-task"), [first, second]);
  assert.deepEqual(await repository.listTaskDocuments("other-task"), []);
});

test("writeTaskDocument requires taskId kind and path", async () => {
  const repository = createRepository();

  await assert.rejects(() => repository.writeTaskDocument("", { kind: "handoff", path: "runtime/tasks/demo/handoff.md" }), TypeError);
  await assert.rejects(() => repository.writeTaskDocument("demo", { path: "runtime/tasks/demo/handoff.md" }), TypeError);
  await assert.rejects(() => repository.writeTaskDocument("demo", { kind: "handoff" }), TypeError);
});
