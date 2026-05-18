import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(testFile), "..");
const skillPath = path.join(rootDir, "bundles", "skills", "ai-context", "SKILL.md");

test("ai-context skill documents chat subcommands as one routed skill", () => {
  const skill = fs.readFileSync(skillPath, "utf8");

  assert.match(skill, /@ai-context:add/);
  assert.match(skill, /@ai-context:task/);
  assert.match(skill, /@ai-context:panel/);
  assert.match(skill, /one\s+ai-context skill/i);
  assert.match(skill, /sub-intent/i);
});

test("ai-context:add contract covers project, scene, skill, and rule association", () => {
  const skill = fs.readFileSync(skillPath, "utf8");

  assert.match(skill, /project path/i);
  assert.match(skill, /AGENTS\.md/);
  assert.match(skill, /CLAUDE\.md/);
  assert.match(skill, /projectIds/);
  assert.match(skill, /sceneIds/);
  assert.match(skill, /add_project_from_path/);
  assert.match(skill, /add_scene/);
  assert.match(skill, /add_skill_from_path/);
  assert.match(skill, /add_rule/);
});
