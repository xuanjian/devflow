import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(testFile), "..");
const scriptPath = path.join(rootDir, "scripts/install-ai-context.mjs");

function runInstallScript(args, env) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    env: { ...process.env, ...env },
    encoding: "utf8"
  });
}

test("install links routing and initialization skills, then tells the user what to run next", () => {
  const skillsHome = fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-skills-"));
  const env = {
    HOME: fs.mkdtempSync(path.join(os.tmpdir(), "ai-context-home-")),
    AI_CONTEXT_SKILLS_HOMES: skillsHome
  };

  const install = runInstallScript(["install"], env);
  assert.equal(install.status, 0, install.stderr);
  assert.match(install.stdout, /installed skill: .*ai-context/);
  assert.match(install.stdout, /installed skill: .*ai-context-init/);
  assert.match(install.stdout, /ai-context-init/);
  assert.equal(fs.lstatSync(path.join(skillsHome, "ai-context")).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(path.join(skillsHome, "ai-context-init")).isSymbolicLink(), true);

  const check = runInstallScript(["check"], env);
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /skill source ai-context: ok/);
  assert.match(check.stdout, /skill source ai-context-init: ok/);
  assert.match(check.stdout, /skill installed: yes/);

  const uninstall = runInstallScript(["uninstall"], env);
  assert.equal(uninstall.status, 0, uninstall.stderr);
  assert.equal(fs.existsSync(path.join(skillsHome, "ai-context")), false);
  assert.equal(fs.existsSync(path.join(skillsHome, "ai-context-init")), false);
});
