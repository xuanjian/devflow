import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(testFile), "..");
const cliPath = path.join(rootDir, "scripts/ai-context-cli.mjs");

function runCli(args, env) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: rootDir,
    env: { ...process.env, ...env },
    encoding: "utf8"
  });
}

test("ai-context init installs selected AI tool targets without exposing internal setup commands", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-cli-home-"));
  const result = runCli(["init", "--tools", "codex,claude-code,qoderwork", "--skip-openspec", "--yes"], {
    HOME: home
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Selected AI tools: Codex, Claude Code, QoderWork/);
  assert.doesNotMatch(result.stdout, /install-ai-context\.mjs setup/);
  assert.equal(fs.lstatSync(path.join(home, ".codex", "skills", "ai-context")).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(path.join(home, ".codex", "skills", "ai-context-init")).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(path.join(home, ".claude", "skills", "ai-context")).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(path.join(home, ".qoderwork", "skills", "ai-context")).isSymbolicLink(), true);
  assert.equal(fs.existsSync(path.join(home, ".agents", "skills", "ai-context")), false);
});
