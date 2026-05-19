import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(testFile), "..");

test("package publishes as DevFlow with the devflow CLI", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));

  assert.equal(pkg.name, "@xuanmimi/devflow");
  assert.deepEqual(pkg.bin, {
    devflow: "scripts/devflow-cli.mjs"
  });
});
