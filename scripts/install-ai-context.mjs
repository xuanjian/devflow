#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const entryPath = path.join(root, 'config', 'entry.json');
const currentPath = path.join(root, 'runtime', 'current.json');
const skillSource = path.join(root, 'bundles', 'skills', 'ai-context');
const skillsHome = process.env.AI_CONTEXT_SKILLS_HOME || path.join(process.env.HOME || '', '.agents', 'skills');
const skillLink = path.join(skillsHome, 'ai-context');
const globalHome = process.env.AI_CONTEXT_GLOBAL_HOME || '/Users/xj';
const allowedRuleApplyModes = new Set(['global', 'project-on-demand', 'scene-on-demand', 'task-gate', 'manual']);

function usage() {
  console.log(`Usage:
  node scripts/install-ai-context.mjs install
  node scripts/install-ai-context.mjs check
  node scripts/install-ai-context.mjs uninstall
  node scripts/install-ai-context.mjs sync-projects
  node scripts/install-ai-context.mjs validate`);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function exists(relativeOrAbsolutePath) {
  if (!relativeOrAbsolutePath) return false;
  const file = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(root, relativeOrAbsolutePath);
  return fs.existsSync(file);
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function projectEntry(project) {
  return `# ${project.name || project.id} AI Entry

Read first:

1. /Users/xj/Documents/ai-context/config/entry.json
2. /Users/xj/Documents/ai-context/config/projects/${project.id}.json
3. /Users/xj/Documents/ai-context/runtime/current.json

Only load source Markdown, rules, or skills when the JSON index selects them for the current task.
`;
}

function cursorRule(project) {
  return `---
alwaysApply: true
---
# ${project.name || project.id} ai-context entry

Read first:
1. \`/Users/xj/Documents/ai-context/config/entry.json\`
2. \`/Users/xj/Documents/ai-context/config/projects/${project.id}.json\`
3. \`/Users/xj/Documents/ai-context/runtime/current.json\`

Do not load all ai-context Markdown by default. Follow the selected JSON indexes.
`;
}

function globalEntry(kind) {
  return `# XUANJIAN ${kind} Entry

Read first:

1. /Users/xj/Documents/ai-context/config/entry.json
2. /Users/xj/Documents/ai-context/config/profile.json
3. /Users/xj/Documents/ai-context/runtime/current.json

Then select project and scene JSON by the user's task. Do not read every Markdown/rule/skill file by default.
`;
}

function ensureSkill() {
  const skillFile = path.join(skillSource, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    throw new Error(`missing skill source: ${skillFile}`);
  }
}

function install() {
  ensureSkill();
  validate();
  fs.mkdirSync(skillsHome, { recursive: true });
  if (fs.existsSync(skillLink) || fs.existsSync(path.dirname(skillLink)) && fs.existsSync(skillLink)) {
    const stat = fs.lstatSync(skillLink);
    if (!stat.isSymbolicLink()) throw new Error(`refusing to replace non-symlink: ${skillLink}`);
    const target = fs.readlinkSync(skillLink);
    if (target !== skillSource) throw new Error(`refusing to replace symlink with unexpected target: ${skillLink} -> ${target}`);
  } else {
    fs.symlinkSync(skillSource, skillLink);
  }

  writeFile(path.join(globalHome, 'AGENTS.md'), globalEntry('Codex'));
  writeFile(path.join(globalHome, 'CLAUDE.md'), globalEntry('Claude'));
  writeFile(path.join(globalHome, 'WORK_CONTEXT.md'), globalEntry('Current Work'));
  console.log(`installed skill: ${skillLink} -> ${skillSource}`);
  console.log(`wrote global entry pointers under ${globalHome}`);
}

function uninstall() {
  if (!fs.existsSync(skillLink)) {
    console.log(`skill link not installed: ${skillLink}`);
    return;
  }
  const stat = fs.lstatSync(skillLink);
  if (!stat.isSymbolicLink()) throw new Error(`refusing to remove non-symlink: ${skillLink}`);
  const target = fs.readlinkSync(skillLink);
  if (target !== skillSource) throw new Error(`refusing to remove symlink with unexpected target: ${skillLink} -> ${target}`);
  fs.unlinkSync(skillLink);
  console.log(`removed skill link: ${skillLink}`);
}

function check() {
  const installed = fs.existsSync(skillLink)
    && fs.lstatSync(skillLink).isSymbolicLink()
    && fs.readlinkSync(skillLink) === skillSource;
  console.log(`entry: ${exists('config/entry.json') ? 'ok' : 'missing'}`);
  console.log(`profile: ${exists('config/profile.json') ? 'ok' : 'missing'}`);
  console.log(`current: ${exists('runtime/current.json') ? 'ok' : 'missing'}`);
  console.log(`skill source: ${exists('bundles/skills/ai-context/SKILL.md') ? 'ok' : 'missing'}`);
  console.log(`skill installed: ${installed ? 'yes' : 'no'}`);
}

function syncProjects() {
  validate();
  const index = readJson('config/projects/index.json');
  let count = 0;
  for (const item of index.projects || []) {
    const project = readJson(item.path);
    if (!project.path || !fs.existsSync(project.path)) continue;
    writeFile(path.join(project.path, 'AGENTS.md'), projectEntry(project));
    writeFile(path.join(project.path, 'CLAUDE.md'), projectEntry(project));
    writeFile(path.join(project.path, '.cursor', 'rules', '00-ai-context.mdc'), cursorRule(project));
    count += 1;
  }
  console.log(`synced ${count} project entry set(s)`);
}

function pushUniqueError(errors, message) {
  if (!errors.includes(message)) errors.push(message);
}

function validateRuleMetadata(rule, label, errors) {
  if (!rule.sourcePath) {
    pushUniqueError(errors, `${label} missing sourcePath`);
  } else {
    if (!rule.sourcePath.startsWith('bundles/rules/')) {
      pushUniqueError(errors, `${label} sourcePath must stay under bundles/rules/: ${rule.sourcePath}`);
    }
    if (rule.sourcePath.endsWith('.mdc')) {
      pushUniqueError(errors, `${label} active rule source must be .md, not .mdc: ${rule.sourcePath}`);
    }
    if (!rule.sourcePath.endsWith('.md')) {
      pushUniqueError(errors, `${label} active rule source must be Markdown .md: ${rule.sourcePath}`);
    }
    if (!exists(rule.sourcePath)) {
      pushUniqueError(errors, `${label} source missing: ${rule.sourcePath}`);
    }
  }
  if (!allowedRuleApplyModes.has(rule.applyMode)) {
    pushUniqueError(errors, `${label} invalid applyMode: ${rule.applyMode || '<missing>'}`);
  }
  if (!Array.isArray(rule.globs) || rule.globs.length === 0) {
    pushUniqueError(errors, `${label} must define non-empty globs`);
  }
  if (!rule.whenToRead) {
    pushUniqueError(errors, `${label} missing whenToRead`);
  }
}

function validateRuleMount(rule, catalogRule, label, errors, expectedApplyMode) {
  if (rule.sourcePath && rule.sourcePath !== catalogRule.sourcePath) {
    pushUniqueError(errors, `${label} sourcePath differs from catalog`);
  }
  if (rule.applyMode && rule.applyMode !== catalogRule.applyMode) {
    pushUniqueError(errors, `${label} applyMode differs from catalog`);
  }
  if (expectedApplyMode && catalogRule.applyMode !== expectedApplyMode) {
    pushUniqueError(errors, `${label} must use applyMode ${expectedApplyMode}, got ${catalogRule.applyMode}`);
  }
  if (rule.whenToRead && rule.whenToRead !== catalogRule.whenToRead) {
    pushUniqueError(errors, `${label} whenToRead differs from catalog`);
  }
  if (rule.sourcePath || rule.applyMode || rule.globs || rule.whenToRead) {
    validateRuleMetadata({ ...catalogRule, ...rule }, label, errors);
  }
}

function validate() {
  const errors = [];
  const warnings = [];

  for (const file of [
    'config/entry.json',
    'config/profile.json',
    'config/projects/index.json',
    'config/scenes/index.json',
    'config/skills/skills.json',
    'config/rules/rules.json',
    'config/tasks/gates.json',
    'runtime/current.json',
    'bundles/skills/ai-context/SKILL.md',
  ]) {
    if (!exists(file)) pushUniqueError(errors, `missing required file: ${file}`);
  }
  if (errors.length) return finishValidation(errors, warnings);

  const entry = readJson('config/entry.json');
  const projectIndex = readJson('config/projects/index.json');
  const sceneIndex = readJson('config/scenes/index.json');
  const skillCatalog = readJson('config/skills/skills.json');
  const ruleCatalog = readJson('config/rules/rules.json');
  const gates = readJson('config/tasks/gates.json');
  const current = readJson('runtime/current.json');
  const profile = readJson('config/profile.json');

  const skillIds = new Set((skillCatalog.skills || []).map(item => item.id));
  const ruleIds = new Set((ruleCatalog.rules || []).map(item => item.id));
  const ruleById = new Map((ruleCatalog.rules || []).map(item => [item.id, item]));
  const sceneIds = new Set((sceneIndex.scenes || []).map(item => item.id));
  const projectIds = new Set((projectIndex.projects || []).map(item => item.id));

  for (const item of projectIndex.projects || []) {
    if (!exists(item.path)) pushUniqueError(errors, `project index points to missing file: ${item.path}`);
    if (!item.id) pushUniqueError(errors, `project index item missing id: ${item.path}`);
    if (exists(item.path)) {
      const project = readJson(item.path);
      if (project.id !== item.id) pushUniqueError(errors, `project index id mismatch: ${item.id} -> ${item.path}`);
    }
  }

  for (const item of sceneIndex.scenes || []) {
    if (!exists(item.path)) pushUniqueError(errors, `scene index points to missing file: ${item.path}`);
    if (!item.id) pushUniqueError(errors, `scene index item missing id: ${item.path}`);
    if (exists(item.path)) {
      const scene = readJson(item.path);
      if (scene.id !== item.id) pushUniqueError(errors, `scene index id mismatch: ${item.id} -> ${item.path}`);
    }
  }

  for (const item of projectIndex.projects || []) {
    if (!exists(item.path)) continue;
    const project = readJson(item.path);
    if (project.doc?.path && !exists(project.doc.path)) {
      pushUniqueError(errors, `project ${project.id} doc path missing: ${project.doc.path}`);
    }
    for (const scene of project.scenes || []) {
      if (!sceneIds.has(scene.id)) pushUniqueError(errors, `project ${project.id} references unknown scene ${scene.id}`);
      if (scene.sourcePath && !exists(scene.sourcePath)) pushUniqueError(errors, `project ${project.id} scene source missing: ${scene.sourcePath}`);
    }
    for (const skill of project.skills || []) {
      if (!skillIds.has(skill.id)) pushUniqueError(errors, `project ${project.id} references unknown skill ${skill.id}`);
    }
    for (const rule of project.rules || []) {
      if (!ruleIds.has(rule.id)) {
        pushUniqueError(errors, `project ${project.id} references unknown rule ${rule.id}`);
      } else {
        const catalogRule = ruleById.get(rule.id);
        validateRuleMount(rule, catalogRule, `project ${project.id} rule ${rule.id}`, errors);
      }
    }
  }

  for (const item of sceneIndex.scenes || []) {
    if (!exists(item.path)) continue;
    const scene = readJson(item.path);
    if (scene.source?.path && !exists(scene.source.path)) {
      pushUniqueError(errors, `scene ${scene.id} source path missing: ${scene.source.path}`);
    }
    for (const project of scene.projects || []) {
      if (!projectIds.has(project.id)) pushUniqueError(errors, `scene ${scene.id} references unknown project ${project.id}`);
      if (project.projectIndexPath && !exists(project.projectIndexPath)) pushUniqueError(errors, `scene ${scene.id} missing project index ${project.projectIndexPath}`);
    }
    for (const rule of scene.rules || []) {
      if (!ruleIds.has(rule.id)) {
        pushUniqueError(errors, `scene ${scene.id} references unknown rule ${rule.id}`);
      } else {
        const catalogRule = ruleById.get(rule.id);
        validateRuleMount(rule, catalogRule, `scene ${scene.id} rule ${rule.id}`, errors, 'scene-on-demand');
      }
    }
  }

  for (const skill of skillCatalog.skills || []) {
    for (const reverseMountKey of ['projects', 'projectIds', 'mountedProjects', 'scenes', 'sceneIds', 'mountedScenes']) {
      if (Object.prototype.hasOwnProperty.call(skill, reverseMountKey)) {
        pushUniqueError(errors, `skill catalog must not reverse-mount ${reverseMountKey}: ${skill.id}`);
      }
    }
    if (skill.sourcePath && !exists(skill.sourcePath)) warnings.push(`skill source not present yet: ${skill.id} -> ${skill.sourcePath}`);
  }

  for (const rule of ruleCatalog.rules || []) {
    validateRuleMetadata(rule, `rule catalog ${rule.id}`, errors);
  }

  for (const gate of gates.gates || []) {
    if (!/^G[1-7]$/.test(gate.id)) pushUniqueError(errors, `invalid gate id: ${gate.id}`);
  }

  if (current.activeTaskPath && !exists(current.activeTaskPath)) {
    pushUniqueError(errors, `active task missing: ${current.activeTaskPath}`);
  }
  for (const projectId of current.activeProjectIds || []) {
    if (!projectIds.has(projectId)) pushUniqueError(errors, `current references unknown project ${projectId}`);
  }
  for (const sceneId of current.activeSceneIds || []) {
    if (!sceneIds.has(sceneId)) pushUniqueError(errors, `current references unknown scene ${sceneId}`);
  }
  if (current.activeTaskPath && exists(current.activeTaskPath)) {
    const activeTask = readJson(current.activeTaskPath);
    if (activeTask.id !== current.activeTaskId) pushUniqueError(errors, `current active task id mismatch: ${current.activeTaskId} -> ${current.activeTaskPath}`);
    for (const projectId of activeTask.projectIds || []) {
      if (!projectIds.has(projectId)) pushUniqueError(errors, `active task references unknown project ${projectId}`);
    }
    for (const sceneId of activeTask.sceneIds || []) {
      if (!sceneIds.has(sceneId)) pushUniqueError(errors, `active task references unknown scene ${sceneId}`);
    }
  }
  if (!entry.installation?.script || !exists(entry.installation.script)) {
    pushUniqueError(errors, 'entry installation script is missing or invalid');
  }
  if (profile.sourcePath && !exists(profile.sourcePath)) {
    pushUniqueError(errors, `profile source path missing: ${profile.sourcePath}`);
  }

  finishValidation(errors, warnings);
}

function finishValidation(errors, warnings) {
  for (const warning of warnings) console.warn(`WARN ${warning}`);
  if (errors.length) {
    for (const error of errors) console.error(`ERROR ${error}`);
    process.exit(1);
  }
  console.log(`ai-context validation passed${warnings.length ? ` with ${warnings.length} warning(s)` : ''}`);
}

try {
  const [command] = process.argv.slice(2);
  if (!command || command === 'help' || command === '-h' || command === '--help') {
    usage();
  } else if (command === 'install') {
    install();
  } else if (command === 'check') {
    check();
  } else if (command === 'uninstall') {
    uninstall();
  } else if (command === 'sync-projects') {
    syncProjects();
  } else if (command === 'validate') {
    validate();
  } else {
    usage();
    process.exit(1);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
