import test from "node:test";
import assert from "node:assert/strict";
import { readJsonFile } from "../../src/core/json-loader.mjs";

test("readJsonFile returns parsed data and no error for valid JSON", async () => {
  const result = await readJsonFile(new URL("./fixtures/basic-ai-context/config/entry.json", import.meta.url));

  assert.equal(result.ok, true);
  assert.equal(result.data.version, 1);
  assert.equal(result.error, undefined);
});

test("readJsonFile returns a recoverable error for missing files", async () => {
  const result = await readJsonFile(new URL("./fixtures/basic-ai-context/config/missing.json", import.meta.url));

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "missing_file");
});
