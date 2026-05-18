import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(testFile), "..");
const skillPath = path.join(rootDir, "bundles", "skills", "ai-context", "SKILL.md");
const readmePath = path.join(rootDir, "README.md");

test("ai-context skill documents chat subcommands as one routed skill", () => {
  const skill = fs.readFileSync(skillPath, "utf8");

  assert.match(skill, /@ai-context:add/);
  assert.match(skill, /@ai-context:del/);
  assert.match(skill, /@ai-context:task/);
  assert.match(skill, /@ai-context:panel/);
  assert.match(skill, /@ai-context:init/);
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

test("ai-context:del contract covers safe removal actions", () => {
  const skill = fs.readFileSync(skillPath, "utf8");

  assert.match(skill, /delete_project/);
  assert.match(skill, /delete_scene/);
  assert.match(skill, /delete_skill/);
  assert.match(skill, /delete_rule/);
  assert.match(skill, /must not delete\s+the real business repository/i);
});

test("README keeps chat entry guidance without a common commands block", () => {
  const readme = fs.readFileSync(readmePath, "utf8");

  assert.match(readme, /## 聊天入口/);
  assert.match(readme, /@ai-context:init/);
  assert.match(readme, /@ai-context:add \/path\/to\/project/);
  assert.match(readme, /@ai-context:del project old-project/);
  assert.match(readme, /@ai-context:task/);
  assert.doesNotMatch(readme, /## 常用命令/);
  assert.doesNotMatch(readme, /## 常用聊天入口/);
  assert.doesNotMatch(readme, /## 终端排障和本地开发/);
  assert.doesNotMatch(readme, /同一个 `ai-context` skill/);
  assert.doesNotMatch(readme, /子意图/);
  assert.doesNotMatch(readme, /底层 action/);
  assert.doesNotMatch(readme, /JSON 索引做路由/);
});
