import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { initializeSchema } from "../../../src/core/storage/schema.mjs";

test("fresh DB applies all migrations in order", () => {
  const db = new Database(":memory:");
  try {
    initializeSchema(db);

    const versions = db.prepare("SELECT version FROM schema_version ORDER BY version").all();
    assert.deepEqual(versions.map((row) => row.version), [1, 2]);

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
    assert.equal(tables.includes("projects"), true);
    assert.equal(tables.includes("config"), true);
    assert.equal(tables.includes("task_documents"), true);
  } finally {
    db.close();
  }
});

test("legacy DB at v1 incrementally applies v2", () => {
  const db = new Database(":memory:");
  try {
    db.exec(`
      CREATE TABLE schema_version (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      INSERT INTO schema_version VALUES (1, '2026-05-01T00:00:00.000Z');
      CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT, technology_family_id TEXT, source_path TEXT, doc_path TEXT, raw_json TEXT NOT NULL);
    `);

    initializeSchema(db);

    const versions = db.prepare("SELECT version FROM schema_version ORDER BY version").all();
    assert.deepEqual(versions.map((row) => row.version), [1, 2]);
  } finally {
    db.close();
  }
});

test("migrations are idempotent", () => {
  const db = new Database(":memory:");
  try {
    initializeSchema(db);
    initializeSchema(db);

    const count = db.prepare("SELECT COUNT(*) AS n FROM schema_version").get().n;
    assert.equal(count, 2);
  } finally {
    db.close();
  }
});
