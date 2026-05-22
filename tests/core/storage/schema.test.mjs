import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  DEVFLOW_SCHEMA_VERSION,
  REQUIRED_TABLES,
  initializeSchema,
  openDevFlowDatabase
} from "../../../src/core/storage/schema.mjs";

test("initializeSchema creates all required SQLite tables and records schema version", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-schema-"));
  const dbPath = path.join(tempDir, "devflow.db");
  const db = openDevFlowDatabase({ dbPath });
  try {
    initializeSchema(db);

    const tableNames = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name).sort();
    for (const tableName of REQUIRED_TABLES) {
      assert.equal(tableNames.includes(tableName), true, `missing table ${tableName}`);
    }
    const version = db.prepare("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1").get();
    assert.equal(version.version, DEVFLOW_SCHEMA_VERSION);
  } finally {
    db.close();
  }
});
