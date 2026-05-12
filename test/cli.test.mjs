import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const testFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(testFile), "..");
const cliPath = path.join(rootDir, "bin", "ai-context-lite.mjs");

function run(args, env = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: rootDir,
    env: { ...process.env, ...env },
    encoding: "utf8"
  });
}

test("doctor validates the minimal repo", () => {
  const result = run(["doctor"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /doctor: ok/);
});

test("install and uninstall manage only configured skill links", () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-lite-"));
  const env = { AI_CONTEXT_HOME_ROOT: tempHome };

  const installResult = run(["install"], env);
  assert.equal(installResult.status, 0, installResult.stderr);

  for (const homeName of [".codex", ".claude", ".agents"]) {
    const linkPath = path.join(tempHome, homeName, "skills", "ai-context");
    assert.equal(fs.lstatSync(linkPath).isSymbolicLink(), true);
  }

  const checkResult = run(["check"], env);
  assert.equal(checkResult.status, 0, checkResult.stderr);
  assert.match(checkResult.stdout, /Codex: linked/);

  const uninstallResult = run(["uninstall"], env);
  assert.equal(uninstallResult.status, 0, uninstallResult.stderr);

  for (const homeName of [".codex", ".claude", ".agents"]) {
    const linkPath = path.join(tempHome, homeName, "skills", "ai-context");
    assert.equal(fs.existsSync(linkPath), false);
  }
});

test("public files do not contain private placeholders", () => {
  const blockedPatterns = [
    /\/Users\//,
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
  ];

  const files = [
    "README.md",
    "README.zh-CN.md",
    "package.json",
    "config/entry.json",
    "config/projects/index.json",
    "docs/intro-panel.html",
    "docs/intro-panel.zh-CN.html",
    "runtime/current.json",
    "skill/ai-context/SKILL.md"
  ];

  for (const file of files) {
    const content = fs.readFileSync(path.join(rootDir, file), "utf8");
    for (const pattern of blockedPatterns) {
      assert.equal(pattern.test(content), false, `${file} matches ${pattern}`);
    }
  }
});
