#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { runAction } from '../src/core/actions.mjs';

const packageRoot = path.resolve(new URL('..', import.meta.url).pathname);
const root = process.env.DEVFLOW_ROOT_OVERRIDE
  ? path.resolve(process.env.DEVFLOW_ROOT_OVERRIDE)
  : packageRoot;
const userHome = process.env.HOME || path.resolve(root, '..', '..');
const coreSkills = [
  { id: 'devflow', sourcePath: path.join(root, 'bundles', 'skills', 'devflow') },
  { id: 'devflow-init', sourcePath: path.join(root, 'bundles', 'skills', 'devflow-init') },
];
const superpowersDir = path.join(userHome, '.codex', 'superpowers');
const skillsHomes = resolveSkillsHomes();
const skillLinks = skillsHomes.flatMap(skillsHome => coreSkills.map(skill => ({
  id: skill.id,
  linkPath: path.join(skillsHome, skill.id),
  sourcePath: skill.sourcePath,
})));

const familyNames = {
  frontend: '前端',
  bff: 'BFF',
  ios: 'iOS',
  workflow: '工作流',
  'ai-tools': 'AI 工具',
  unknown: '未知',
};

const repoTypes = {
  frontend: 'web-app',
  bff: 'egg-service',
  ios: 'ios-app',
  workflow: 'context-config-center',
  'ai-tools': 'ai-workspace',
  unknown: 'repository',
};

function resolveSkillsHomes() {
  const explicitHomes = process.env.AI_CONTEXT_SKILLS_HOMES || process.env.AI_CONTEXT_SKILLS_HOME;
  if (explicitHomes) {
    return uniqueSorted(
      explicitHomes
        .split(/[,;]/)
        .map(item => item.trim())
        .filter(Boolean)
    );
  }
  const home = userHome;
  return uniqueSorted([
    path.join(home, '.agents', 'skills'),
    path.join(home, '.codex', 'skills'),
    path.join(home, '.claude', 'skills'),
  ]);
}

function usage() {
  console.log(`Usage:
  node scripts/contextctl.mjs doctor
  node scripts/contextctl.mjs task start <title> [options]
  node scripts/contextctl.mjs task update [task-id] [options]
  node scripts/contextctl.mjs task artifact [task-id] --file <path> [options]
  node scripts/contextctl.mjs task finish [task-id] [options]
  node scripts/contextctl.mjs add project <repo-path> [options]
  node scripts/contextctl.mjs add skill <skill-dir> [options]

Task options:
  --id <id>                 Task id. Defaults to YYYY-MM-DD + title slug.
  --projects <a,b,c>        Active project ids.
  --scenes <a,b,c>          Active scene ids.
  --gate <G1-G7>            Current gate. Defaults to G1 for start.
  --status <status>         Task status. Defaults to active for start, done for finish.
  --level <L1-L4>           Task size/risk level.
  --summary <summary>       Task summary.
  --note <text>             Append a timestamped note.
  --artifact <path-or-text>  Append an artifact entry to the current gate. Can be repeated via comma list.
  --file <path>             For task artifact: copy an existing file into runtime/tasks/<task-id>/<gate>/.
  --name <filename>         For task artifact: destination filename.
  --blocker <text>          Append a blocker entry.
  --recovery <text>         Set recovery point.
  --dry-run                 Print the task payload without writing files.
  --force                   Allow task start to overwrite an existing task file.

Add project options:
  --id <id>                 Project id. Defaults to repo folder name in kebab-case.
  --path <repo-path>        Project repository path.
  --name <name>             Display name. Defaults to repo folder name.
  --family <family>         frontend | bff | ios | workflow | ai-tools | unknown.
  --repo-type <type>        Defaults from family.
  --summary <summary>       Project summary.
  --tags <a,b,c>            Tags.
  --scenes <a,b,c>          Scene ids to mount. Defaults to the first configured scene.
  --rules <a,b,c>           Project rule ids to mount.
  --skills <a,b,c>          Skill ids to mount.
  --yes                     Use inferred/default values without prompts.
  --dry-run                 Print the plan without writing files.
  --force                   Overwrite existing generated project config.
  --allow-missing           Allow repo path that does not exist yet.
  --sync-projects           Run install-ai-context sync-projects after writing.

Add skill options:
  --id <id>                 Skill id. Defaults to folder name.
  --name <name>             Display name. Defaults to skill id or SKILL.md frontmatter name.
  --description <text>      Description. Defaults to SKILL.md frontmatter description.
  --trigger <text>          Trigger text. Defaults to description.
  --tags <a,b,c>            Tags.
  --scenes <a,b,c>          Default scene ids.
  --family <family>         Mount to projects with this technologyFamilyId.
  --projects <a,b,c>        Mount to specific project ids.
  --yes                     Use inferred/default values without prompts.
  --force                   Overwrite existing catalog entry.
`);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function relativeToRoot(absoluteOrRelativePath) {
  const absolutePath = path.isAbsolute(absoluteOrRelativePath)
    ? absoluteOrRelativePath
    : path.join(root, absoluteOrRelativePath);
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function writeJson(relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function parseArgs(rawArgs) {
  const positionals = [];
  const flags = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const equalIndex = token.indexOf('=');
    if (equalIndex !== -1) {
      flags[token.slice(2, equalIndex)] = token.slice(equalIndex + 1);
      continue;
    }
    const key = token.slice(2);
    const next = rawArgs[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return { positionals, flags };
}

function listFromFlag(value) {
  if (!value || value === true) return [];
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function uniqueStable(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeProjectId(value) {
  return String(value || '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTaskId(value) {
  return normalizeProjectId(value).slice(0, 80);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function ensureGateId(gateId) {
  const value = gateId || 'G1';
  if (!/^G[1-7]$/.test(value)) throw new Error(`invalid gate id: ${value}`);
  return value;
}

function ensureTaskLevel(level) {
  if (!level) return undefined;
  if (!/^L[1-4]$/.test(level)) throw new Error(`invalid task level: ${level}`);
  return level;
}

function taskPath(taskId) {
  return `runtime/tasks/${taskId}.json`;
}

function taskDir(taskId) {
  return `runtime/tasks/${taskId}`;
}

function taskGateDir(taskId, gateId) {
  return `${taskDir(taskId)}/${gateId}`;
}

function taskTitleFromPositionals(positionals, flags) {
  const title = flags.title || positionals.join(' ').trim();
  if (!title) throw new Error('task title is required');
  return title;
}

function inferTaskId(title, flags) {
  const id = normalizeTaskId(flags.id || `${todayString()}-${title}`);
  if (!id) throw new Error('task id is required');
  return id;
}

function readKnownIdSets() {
  const projectIndex = readJson('config/projects/index.json');
  const sceneIndex = readJson('config/scenes/index.json');
  return {
    projectIds: new Set((projectIndex.projects || []).map(item => item.id)),
    sceneIds: new Set((sceneIndex.scenes || []).map(item => item.id)),
  };
}

function ensureKnownTaskScope(projectIds, sceneIds) {
  const known = readKnownIdSets();
  for (const projectId of projectIds) {
    if (!known.projectIds.has(projectId)) throw new Error(`unknown project: ${projectId}`);
  }
  for (const sceneId of sceneIds) {
    if (!known.sceneIds.has(sceneId)) throw new Error(`unknown scene: ${sceneId}`);
  }
}

function gateStatus(gateId, currentGateId) {
  const gateNumber = Number(gateId.slice(1));
  const currentGateNumber = Number(currentGateId.slice(1));
  if (gateNumber < currentGateNumber) return 'done';
  if (gateNumber === currentGateNumber) return 'in_progress';
  return 'pending';
}

function buildTaskGates(currentGateId) {
  const gates = readJson('config/tasks/gates.json').gates || [];
  return gates.map(gate => ({
    ...gate,
    status: gateStatus(gate.id, currentGateId),
    artifacts: [],
  }));
}

function updateTaskGateStatuses(task, currentGateId) {
  const gateCatalog = readJson('config/tasks/gates.json').gates || [];
  const existingById = new Map((task.gates || []).map(gate => [gate.id, gate]));
  task.gates = gateCatalog.map(gate => ({
    ...gate,
    ...(existingById.get(gate.id) || {}),
    status: gateStatus(gate.id, currentGateId),
    artifacts: existingById.get(gate.id)?.artifacts || [],
  }));
}

function appendFlagEntries(target, flagValue, makeEntry) {
  for (const value of listFromFlag(flagValue)) {
    target.push(makeEntry(value));
  }
}

function ensureTaskWorkspace(taskId) {
  for (const gate of readJson('config/tasks/gates.json').gates || []) {
    fs.mkdirSync(path.join(root, taskGateDir(taskId, gate.id)), { recursive: true });
  }
}

function gateForTask(task, gateId) {
  const id = ensureGateId(gateId || task.currentGate || 'G1');
  updateTaskGateStatuses(task, id);
  return task.gates.find(gate => gate.id === id);
}

function appendGateArtifacts(task, gateId, values, timestamp) {
  const gate = gateForTask(task, gateId);
  gate.artifacts = gate.artifacts || [];
  for (const value of listFromFlag(values)) {
    gate.artifacts.push({ at: timestamp, value });
  }
}

function readTask(taskId) {
  const relativePath = taskPath(taskId);
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`task not found: ${relativePath}`);
  return { relativePath, task: readJson(relativePath) };
}

function resolveTaskId(positionals) {
  if (positionals[0]) return positionals[0];
  const current = readJson('runtime/current.json');
  if (!current.activeTaskId) throw new Error('task id is required and no active task is set');
  return current.activeTaskId;
}

function writeCurrentForTask(task) {
  const current = readJson('runtime/current.json');
  current.activeTaskId = task.id;
  current.activeTaskPath = taskPath(task.id);
  current.activeProjectIds = task.projectIds || [];
  current.activeSceneIds = task.sceneIds || [];
  current.currentGate = task.currentGate;
  current.recentTaskIds = uniqueStable([task.id, ...(current.recentTaskIds || [])]).slice(0, 20);
  current.note = 'Current work is stored in task JSON. runtime/current-work.md is deprecated.';
  writeJson('runtime/current.json', current);
}

function printTaskSummary(task, dryRun) {
  console.log(`${dryRun ? 'dry-run task' : 'task'}: ${task.id}`);
  console.log(`  title: ${task.title}`);
  console.log(`  status: ${task.status}`);
  console.log(`  gate: ${task.currentGate}`);
  console.log(`  projects: ${(task.projectIds || []).join(', ') || 'none'}`);
  console.log(`  scenes: ${(task.sceneIds || []).join(', ') || 'none'}`);
  if (task.recoveryPoint) console.log(`  recovery: ${task.recoveryPoint}`);
}

async function taskStart(positionals, flags) {
  const title = taskTitleFromPositionals(positionals, flags);
  const id = inferTaskId(title, flags);
  const currentGate = ensureGateId(flags.gate || 'G1');
  const projectIds = listFromFlag(flags.projects);
  const sceneIds = uniqueStable(listFromFlag(flags.scenes));
  const level = ensureTaskLevel(flags.level);
  ensureKnownTaskScope(projectIds, sceneIds);

  const relativePath = taskPath(id);
  if (fs.existsSync(path.join(root, relativePath)) && !flags.force) {
    throw new Error(`task already exists without --force: ${relativePath}`);
  }

  const timestamp = nowIso();
  const task = {
    version: 1,
    id,
    title,
    status: flags.status || 'active',
    taskLevel: level,
    currentGate,
    projectIds,
    sceneIds,
    summary: flags.summary || '',
    gates: buildTaskGates(currentGate),
    projectProgress: projectIds.map(projectId => ({
      projectId,
      status: 'pending',
      summary: '',
    })),
    notes: [],
    blockers: [],
    artifacts: [],
    recoveryPoint: flags.recovery || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  if (flags.note) task.notes.push({ at: timestamp, gate: currentGate, text: String(flags.note) });
  appendGateArtifacts(task, currentGate, flags.artifact, timestamp);
  appendFlagEntries(task.blockers, flags.blocker, value => ({ at: timestamp, status: 'open', text: value }));

  if (flags['dry-run']) {
    printTaskSummary(task, true);
    console.log(JSON.stringify(task, null, 2));
    return;
  }

  ensureTaskWorkspace(task.id);
  writeJson(relativePath, task);
  writeCurrentForTask(task);
  printTaskSummary(task, false);
}

async function taskUpdate(positionals, flags) {
  const taskId = resolveTaskId(positionals);
  const { relativePath, task } = readTask(taskId);
  const timestamp = nowIso();
  if (flags.status) task.status = flags.status;
  if (flags.gate) {
    task.currentGate = ensureGateId(flags.gate);
    updateTaskGateStatuses(task, task.currentGate);
  }
  if (flags.level) task.taskLevel = ensureTaskLevel(flags.level);
  if (flags.summary) task.summary = flags.summary;
  if (flags.projects) task.projectIds = listFromFlag(flags.projects);
  if (flags.scenes) task.sceneIds = uniqueStable(listFromFlag(flags.scenes));
  ensureKnownTaskScope(task.projectIds || [], task.sceneIds || []);
  if (flags.recovery) task.recoveryPoint = flags.recovery;
  if (flags.note) {
    task.notes = task.notes || [];
    task.notes.push({ at: timestamp, gate: task.currentGate, text: String(flags.note) });
  }
  task.blockers = task.blockers || [];
  appendGateArtifacts(task, task.currentGate, flags.artifact, timestamp);
  appendFlagEntries(task.blockers, flags.blocker, value => ({ at: timestamp, status: 'open', text: value }));
  task.updatedAt = timestamp;

  if (flags['dry-run']) {
    printTaskSummary(task, true);
    console.log(JSON.stringify(task, null, 2));
    return;
  }

  ensureTaskWorkspace(task.id);
  writeJson(relativePath, task);
  writeCurrentForTask(task);
  printTaskSummary(task, false);
}

async function taskArtifact(positionals, flags) {
  const taskId = resolveTaskId(positionals);
  const { relativePath, task } = readTask(taskId);
  const gateId = ensureGateId(flags.gate || task.currentGate || 'G1');
  const sourceFile = flags.file ? path.resolve(String(flags.file)) : '';
  if (!sourceFile) {
    throw new Error('task artifact requires --file <path>');
  }
  if (!fs.existsSync(sourceFile) || !fs.statSync(sourceFile).isFile()) {
    throw new Error(`artifact file not found: ${sourceFile}`);
  }

  ensureTaskWorkspace(task.id);
  const timestamp = nowIso();
  const targetName = safeArtifactFileName(flags.name || path.basename(sourceFile));
  const targetRelativePath = `${taskGateDir(task.id, gateId)}/${targetName}`;
  const targetAbsolutePath = path.join(root, targetRelativePath);
  fs.mkdirSync(path.dirname(targetAbsolutePath), { recursive: true });
  fs.copyFileSync(sourceFile, targetAbsolutePath);

  const gate = gateForTask(task, gateId);
  gate.artifacts = gate.artifacts || [];
  gate.artifacts.push({
    at: timestamp,
    value: targetRelativePath,
    sourcePath: sourceFile,
    note: flags.note ? String(flags.note) : undefined,
  });
  task.updatedAt = timestamp;

  if (flags['dry-run']) {
    printTaskSummary(task, true);
    console.log(`  artifact: ${targetRelativePath}`);
    return;
  }

  writeJson(relativePath, task);
  writeCurrentForTask(task);
  printTaskSummary(task, false);
  console.log(`  artifact: ${targetRelativePath}`);
}

async function taskFinish(positionals, flags) {
  const taskId = resolveTaskId(positionals);
  const { relativePath, task } = readTask(taskId);
  const timestamp = nowIso();
  task.status = flags.status || 'done';
  task.currentGate = ensureGateId(flags.gate || 'G7');
  updateTaskGateStatuses(task, task.currentGate);
  if (flags.summary) task.summary = flags.summary;
  if (flags.recovery) task.recoveryPoint = flags.recovery;
  task.notes = task.notes || [];
  if (flags.note) task.notes.push({ at: timestamp, gate: task.currentGate, text: String(flags.note) });
  appendGateArtifacts(task, task.currentGate, flags.artifact, timestamp);
  task.updatedAt = timestamp;

  if (flags['dry-run']) {
    printTaskSummary(task, true);
    console.log(JSON.stringify(task, null, 2));
    return;
  }

  ensureTaskWorkspace(task.id);
  writeJson(relativePath, task);
  writeCurrentForTask(task);
  printTaskSummary(task, false);
}

function safeArtifactFileName(value) {
  const fileName = path.basename(String(value || '').trim());
  if (!fileName || fileName === '.' || fileName === '..') {
    throw new Error('artifact filename is required');
  }
  return fileName.replace(/[/:\\]/g, '-');
}

function readPackage(projectPath) {
  const packagePath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packagePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch {
    return null;
  }
}

function dependencyNames(pkg) {
  if (!pkg) return [];
  return [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ];
}

function inferFamily(projectPath, pkg) {
  const normalized = projectPath.split(path.sep).join('/');
  const deps = dependencyNames(pkg).join(' ');
  if (normalized.includes('/Documents/ai-context') || normalized.includes('/Documents/devflow')) return 'workflow';
  if (normalized.includes('/frontend/')) return 'frontend';
  if (normalized.includes('/node/')) return 'bff';
  if (normalized.includes('/ios/')) return 'ios';
  if (/comfyui|auto[-_]?glm|ai[-_]?tool/i.test(normalized)) return 'ai-tools';
  if (/(react|vue|vite|taro|webpack|next)/i.test(deps)) return 'frontend';
  if (/(egg|tegg|koa|midway)/i.test(deps)) return 'bff';
  return 'unknown';
}

function inferRepoType(family, pkg) {
  const deps = dependencyNames(pkg).join(' ');
  if (family === 'frontend' && /taro/i.test(deps)) return 'taro-app-or-package';
  return repoTypes[family] || repoTypes.unknown;
}

function inferTags(id, projectPath, family) {
  const normalized = projectPath.toLowerCase();
  const tags = [family];
  if (id.includes('mobile') || normalized.includes('/h5') || normalized.includes('h5')) tags.push('mobile');
  if (id.includes('mini')) tags.push('mini-program');
  if (id.includes('bff')) tags.push('bff');
  return uniqueSorted(tags);
}

function inferRole(project) {
  if (project.technologyFamilyId === 'bff') return 'api-or-business-service';
  if (project.technologyFamilyId === 'ios') return 'native-container-or-app';
  if (project.technologyFamilyId === 'workflow') return 'workflow-config';
  if (project.technologyFamilyId === 'ai-tools') return 'workspace-root';
  if (project.id.includes('packages')) return 'subpackage-or-business-module';
  if (project.id.includes('mini')) return 'mini-program-app';
  if (project.id.includes('img')) return 'asset-service';
  if (project.id.includes('utils')) return 'shared-library';
  if (project.technologyFamilyId === 'frontend') return 'frontend-entry-or-page';
  return 'repository';
}

function inferDefaultScenes(sceneIndex) {
  return sceneIndex.scenes?.[0]?.id ? [sceneIndex.scenes[0].id] : [];
}

function inferDefaultRules(project, ruleCatalog) {
  const ruleIds = new Set((ruleCatalog.rules || []).map(rule => rule.id));
  const candidates = [];
  if (project.technologyFamilyId === 'frontend') candidates.push('frontend/core');
  if (project.technologyFamilyId === 'bff') candidates.push('bff/egg-service');
  return candidates.filter(id => ruleIds.has(id));
}

function inferDefaultSkills(project, skillCatalog) {
  if (project.id === 'devflow') return ['devflow'];
  const skillIds = new Set((skillCatalog.skills || []).map(skill => skill.id));
  const candidates = [];
  return candidates.filter(id => skillIds.has(id));
}

function makeRuleMount(rule) {
  return {
    id: rule.id,
    name: rule.name,
    purpose: rule.purpose,
    sourcePath: rule.sourcePath,
    applyMode: rule.applyMode,
    globs: rule.globs || ['**/*'],
    whenToRead: rule.whenToRead,
  };
}

function makeSkillMount(skill) {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    sourcePath: skill.sourcePath,
    whenToLoad: skill.whenToLoad,
  };
}

function uniqueSortedMounts(items) {
  const byId = new Map();
  for (const item of items || []) {
    if (!item?.id) continue;
    byId.set(item.id, { ...byId.get(item.id), ...item });
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function readSkillFrontmatter(skillFile) {
  const content = fs.readFileSync(skillFile, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
    frontmatter[key] = value;
  }
  return frontmatter;
}

function makeSceneMount(scene) {
  return {
    id: scene.id,
    name: scene.name,
    summary: scene.summary,
    sourcePath: scene.sourcePath,
    reason: `${scene.name || scene.id} is selected for this project.`,
  };
}

function inferTools(project) {
  if (project.technologyFamilyId === 'frontend') {
    return { figma: true, notion: true, playwright: true, xcode: false, bffDebug: true, codex: true };
  }
  if (project.technologyFamilyId === 'bff') {
    return { notion: true, codex: true, bffDebug: true };
  }
  if (project.technologyFamilyId === 'ios') {
    return { notion: true, codex: true, xcode: true };
  }
  return { codex: true };
}

function buildProjectConfig(project, selectedScenes, selectedRules, selectedSkills) {
  const docPath = project.docPath;
  return {
    version: 1,
    id: project.id,
    name: project.name,
    technologyFamilyId: project.technologyFamilyId,
    technologyFamilyName: familyNames[project.technologyFamilyId] || familyNames.unknown,
    repoType: project.repoType,
    summary: project.summary,
    path: project.path,
    tags: project.tags,
    doc: {
      path: docPath,
      title: project.name,
      summary: project.summary,
      whenToRead: 'Read only after this project is selected for the task or the JSON summary is insufficient.',
    },
    scenes: selectedScenes.map(makeSceneMount),
    skills: selectedSkills.map(makeSkillMount),
    rules: selectedRules.map(makeRuleMount),
    tools: inferTools(project),
    readPolicy: {
      defaultRead: [`config/projects/${project.id}.json`],
      onDemandRead: [
        docPath,
        ...selectedScenes.map(scene => scene.sourcePath).filter(Boolean),
        ...selectedRules.map(rule => rule.sourcePath).filter(Boolean),
        ...selectedSkills.map(skill => skill.sourcePath).filter(Boolean),
      ],
      notes: 'Start with this JSON. Load source Markdown, rules, or skills only when the task requires detailed instructions.',
    },
  };
}

function buildProjectDoc(project) {
  const ruleLines = project.ruleIds.length
    ? project.ruleIds.map(id => `- \`${id}\``).join('\n')
    : '- none';
  const skillLines = project.skillIds.length
    ? project.skillIds.map(id => `- \`${id}\``).join('\n')
    : '- none';
  const tags = project.tags.length ? project.tags.map(tag => `- \`${tag}\``).join('\n') : '- none';

  return `# ${project.name}

## 基本信息

- repoKey: \`${project.id}\`
- path: \`${project.path}\`
- technologyFamilyId: \`${project.technologyFamilyId}\`
- technologyFamilyName: \`${familyNames[project.technologyFamilyId] || familyNames.unknown}\`
- repoType: \`${project.repoType}\`

## 项目定位

${project.summary}

## 技术栈/关键目录

- 先从仓库 README、package 配置或工程入口确认实际技术栈。
- 只有任务命中该项目时再进入仓库读取源码，不默认加载全部项目资料。

## 典型使用场景

- 该仓库内的需求开发、问题排查、配置调整或文档维护。
- 与所选场景相关的跨项目联调。

## 与其他项目关系

- 先由 \`config/projects/${project.id}.json\` 和命中的 scene JSON 判断关系。
- 不确定链路时，使用 superpowers 推进澄清，并用 runtime task state 记录项目、场景、Gate 和恢复位置。

## 读取建议

- 先读 \`config/projects/${project.id}.json\`。
- JSON 摘要不足时再读本文件和仓库内 README。
- 需要执行规则或技能时，只读取下方挂载的 rules / skills。

## 默认 Rules

${ruleLines}

## 默认 Skills

${skillLines}

## 标签

${tags}
`;
}

async function promptText(rl, label, defaultValue) {
  if (!rl) return defaultValue;
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const answer = await rl.question(`${label}${suffix}: `);
  return answer.trim() || defaultValue;
}

function parseMultiSelection(answer, items, defaultIds) {
  const trimmed = answer.trim();
  if (!trimmed) return defaultIds;
  if (/^(none|no|n)$/i.test(trimmed)) return [];
  const byId = new Map(items.map(item => [item.id, item.id]));
  const values = trimmed.split(/[,\s]+/).map(item => item.trim()).filter(Boolean);
  const selected = values.map(value => {
    if (/^\d+$/.test(value)) {
      const item = items[Number(value) - 1];
      if (!item) throw new Error(`invalid selection number: ${value}`);
      return item.id;
    }
    if (!byId.has(value)) throw new Error(`unknown selection id: ${value}`);
    return value;
  });
  return uniqueSorted(selected);
}

async function promptMulti(rl, label, items, defaultIds) {
  if (!rl) return defaultIds;
  console.log(`\n${label}`);
  items.forEach((item, index) => {
    const mark = defaultIds.includes(item.id) ? '*' : ' ';
    const summary = item.summary || item.description || item.purpose || '';
    console.log(`${mark} ${index + 1}. ${item.id}${item.name ? ` - ${item.name}` : ''}${summary ? `: ${summary}` : ''}`);
  });
  const defaultText = defaultIds.length ? defaultIds.join(',') : 'none';
  const answer = await rl.question(`Select ${label} [${defaultText}]: `);
  return parseMultiSelection(answer, items, defaultIds);
}

async function promptConfirm(rl, label, defaultValue) {
  if (!rl) return defaultValue;
  const answer = await rl.question(`${label} (${defaultValue ? 'Y/n' : 'y/N'}): `);
  if (!answer.trim()) return defaultValue;
  return /^y(es)?$/i.test(answer.trim());
}

function commandExists(command) {
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function doctor() {
  const checks = [];
  function add(label, ok, detail = '') {
    checks.push({ label, ok, detail });
  }

  add('node', Boolean(process.execPath), process.version);
  add('codex command', commandExists('codex'), commandExists('codex') ? 'found in PATH' : 'not found in PATH');
  add('superpowers', fs.existsSync(superpowersDir), superpowersDir);
  add('DevFlow root', fs.existsSync(root), root);
  add('entry.json', fs.existsSync(path.join(root, 'config', 'entry.json')), 'config/entry.json');
  add('profile.json', fs.existsSync(path.join(root, 'config', 'profile.json')), 'config/profile.json');
  add('current.json', fs.existsSync(path.join(root, 'runtime', 'current.json')), 'runtime/current.json');
  for (const skill of coreSkills) {
    add(`${skill.id} skill source`, fs.existsSync(path.join(skill.sourcePath, 'SKILL.md')), skill.sourcePath);
  }

  for (const skillLink of skillLinks) {
    let skillInstalled = false;
    let skillDetail = skillLink.linkPath;
    if (fs.existsSync(skillLink.linkPath)) {
      const stat = fs.lstatSync(skillLink.linkPath);
      skillInstalled = stat.isSymbolicLink() && fs.readlinkSync(skillLink.linkPath) === skillLink.sourcePath;
      skillDetail = stat.isSymbolicLink() ? `${skillLink.linkPath} -> ${fs.readlinkSync(skillLink.linkPath)}` : `${skillLink.linkPath} is not a symlink`;
    }
    add(`${skillLink.id} skill link ${path.dirname(skillLink.linkPath)}`, skillInstalled, skillDetail);
  }

  try {
    execFileSync(process.execPath, ['scripts/install-ai-context.mjs', 'validate'], {
      cwd: root,
      stdio: 'pipe',
    });
    add('validate', true, 'node scripts/install-ai-context.mjs validate');
  } catch (error) {
    add('validate', false, error.stdout?.toString().trim() || error.message);
  }

  for (const check of checks) {
    console.log(`${check.ok ? 'ok  ' : 'miss'} ${check.label}${check.detail ? ` - ${check.detail}` : ''}`);
  }

  if (checks.some(check => !check.ok)) process.exit(1);
}

function ensureKnownIds(label, selectedIds, knownItems) {
  const known = new Set(knownItems.map(item => item.id));
  for (const id of selectedIds) {
    if (!known.has(id)) throw new Error(`unknown ${label}: ${id}`);
  }
}

function upsertProjectIndex(projectIndex, project) {
  const item = {
    id: project.id,
    name: project.name,
    technologyFamilyId: project.technologyFamilyId,
    path: `config/projects/${project.id}.json`,
    summary: project.summary,
  };
  const existingIndex = (projectIndex.projects || []).findIndex(existing => existing.id === project.id);
  if (existingIndex === -1) {
    projectIndex.projects = [...(projectIndex.projects || []), item];
  } else {
    projectIndex.projects[existingIndex] = item;
  }
  projectIndex.projects.sort((a, b) => a.id.localeCompare(b.id));
  projectIndex.generatedAt = new Date().toISOString();
}

function updateSelectedScenes(project, selectedScenes) {
  for (const sceneIndexItem of selectedScenes) {
    const scenePath = sceneIndexItem.path;
    const scene = readJson(scenePath);
    const projectEntry = {
      id: project.id,
      name: project.name,
      role: inferRole(project),
      projectIndexPath: `config/projects/${project.id}.json`,
      reason: `${project.name} is part of ${scene.name || scene.id}.`,
    };
    scene.projects = scene.projects || [];
    const existingIndex = scene.projects.findIndex(item => item.id === project.id);
    if (existingIndex === -1) {
      scene.projects.push(projectEntry);
    } else {
      scene.projects[existingIndex] = projectEntry;
    }
    scene.projects.sort((a, b) => a.id.localeCompare(b.id));
    if (scene.readPolicy?.onDemandRead) {
      scene.readPolicy.onDemandRead = uniqueSorted([
        ...scene.readPolicy.onDemandRead,
        `config/projects/${project.id}.json`,
      ]);
    }
    writeJson(scenePath, scene);
  }
}

function updateRuleCatalog(project, selectedRuleIds, selectedSceneIds) {
  const catalog = readJson('config/rules/rules.json');
  for (const rule of catalog.rules || []) {
    if (!selectedRuleIds.includes(rule.id)) continue;
    rule.projectIds = uniqueSorted([...(rule.projectIds || []), project.id]);
    rule.technologyFamilyIds = uniqueSorted([...(rule.technologyFamilyIds || []), project.technologyFamilyId]);
    rule.sceneIds = uniqueSorted([...(rule.sceneIds || []), ...selectedSceneIds]);
  }
  catalog.generatedAt = new Date().toISOString();
  writeJson('config/rules/rules.json', catalog);
}

function upsertSkillCatalog(skillCatalog, skill, force) {
  const existingIndex = (skillCatalog.skills || []).findIndex(item => item.id === skill.id);
  if (existingIndex !== -1 && !force) {
    throw new Error(`skill already exists in catalog without --force: ${skill.id}`);
  }
  if (existingIndex === -1) {
    skillCatalog.skills = [...(skillCatalog.skills || []), skill];
  } else {
    skillCatalog.skills[existingIndex] = skill;
  }
  skillCatalog.skills.sort((a, b) => a.id.localeCompare(b.id));
  skillCatalog.generatedAt = new Date().toISOString();
}

function mountSkillToProjects(skill, selectedProjectIds) {
  const projectIndex = readJson('config/projects/index.json');
  for (const item of projectIndex.projects || []) {
    if (!selectedProjectIds.includes(item.id)) continue;
    const project = readJson(item.path);
    project.skills = project.skills || [];
    const mount = makeSkillMount(skill);
    const existingIndex = project.skills.findIndex(item => item.id === skill.id);
    if (existingIndex === -1) {
      project.skills.push(mount);
    } else {
      project.skills[existingIndex] = mount;
    }
    project.skills.sort((a, b) => a.id.localeCompare(b.id));
    if (project.readPolicy?.onDemandRead) {
      project.readPolicy.onDemandRead = uniqueSorted([
        ...project.readPolicy.onDemandRead,
        skill.sourcePath,
      ]);
    }
    writeJson(item.path, project);
  }
}

function printProjectPlan(project, selectedSceneIds, selectedRuleIds, selectedSkillIds) {
  console.log('\nProject plan');
  console.log(`  id: ${project.id}`);
  console.log(`  name: ${project.name}`);
  console.log(`  path: ${project.path}`);
  console.log(`  family: ${project.technologyFamilyId}`);
  console.log(`  repoType: ${project.repoType}`);
  console.log(`  summary: ${project.summary}`);
  console.log(`  tags: ${project.tags.join(', ') || 'none'}`);
  console.log(`  scenes: ${selectedSceneIds.join(', ') || 'none'}`);
  console.log(`  rules: ${selectedRuleIds.join(', ') || 'none'}`);
  console.log(`  skills: ${selectedSkillIds.join(', ') || 'none'}`);
}

async function addProject(positionals, flags) {
  const sceneIndex = readJson('config/scenes/index.json');
  const ruleCatalog = readJson('config/rules/rules.json');
  const skillCatalog = readJson('config/skills/skills.json');
  const projectIndex = readJson('config/projects/index.json');
  const projectRuleItems = (ruleCatalog.rules || []).filter(rule => rule.applyMode !== 'scene-on-demand');
  const interactive = Boolean(process.stdin.isTTY && !flags.yes);
  const rl = interactive ? createInterface({ input, output }) : null;

  try {
    if (!interactive && !flags.yes && !flags['dry-run']) {
      throw new Error('non-interactive add project requires --yes or --dry-run');
    }

    const inputPath = flags.path || positionals[0] || '';
    const promptedPath = await promptText(rl, 'Project path', inputPath);
    if (!promptedPath) throw new Error('project path is required');
    const projectPath = path.resolve(promptedPath);
    if (!fs.existsSync(projectPath) && !flags['allow-missing']) {
      throw new Error(`project path does not exist: ${projectPath}`);
    }

    const pkg = readPackage(projectPath);
    const folderName = path.basename(projectPath);
    const inferredId = normalizeProjectId(flags.id || folderName);
    const id = normalizeProjectId(await promptText(rl, 'Project id', inferredId));
    if (!id) throw new Error('project id is required');

    const inferredName = flags.name || pkg?.name || folderName;
    const name = await promptText(rl, 'Project name', inferredName);
    const inferredFamily = flags.family || inferFamily(projectPath, pkg);
    const technologyFamilyId = await promptText(rl, 'Technology family', inferredFamily);
    const repoType = await promptText(rl, 'Repo type', flags['repo-type'] || inferRepoType(technologyFamilyId, pkg));
    const summary = await promptText(rl, 'Summary', flags.summary || `${name} 项目。`);
    const tags = uniqueSorted(listFromFlag(flags.tags).length ? listFromFlag(flags.tags) : inferTags(id, projectPath, technologyFamilyId));
    const promptedTags = await promptText(rl, 'Tags comma list', tags.join(','));
    const finalTags = uniqueSorted(listFromFlag(promptedTags));

    const draftProject = {
      id,
      name,
      technologyFamilyId,
      technologyFamilyName: familyNames[technologyFamilyId] || familyNames.unknown,
      repoType,
      summary,
      path: projectPath,
      tags: finalTags,
      docPath: path.join(projectPath, '.ai-configs/project.md'),
    };

    const defaultSceneIds = listFromFlag(flags.scenes).length ? listFromFlag(flags.scenes) : inferDefaultScenes(sceneIndex);
    const selectedSceneIds = await promptMulti(rl, 'Scenes to mount', sceneIndex.scenes || [], defaultSceneIds);
    ensureKnownIds('scene', selectedSceneIds, sceneIndex.scenes || []);

    const defaultRuleIds = listFromFlag(flags.rules).length ? listFromFlag(flags.rules) : inferDefaultRules(draftProject, ruleCatalog);
    const selectedRuleIds = await promptMulti(rl, 'Project rules to mount', projectRuleItems, defaultRuleIds);
    ensureKnownIds('rule', selectedRuleIds, projectRuleItems);

    const defaultSkillIds = listFromFlag(flags.skills).length ? listFromFlag(flags.skills) : inferDefaultSkills(draftProject, skillCatalog);
    const selectedSkillIds = await promptMulti(rl, 'Skills to mount', skillCatalog.skills || [], defaultSkillIds);
    ensureKnownIds('skill', selectedSkillIds, skillCatalog.skills || []);

    const selectedScenes = selectedSceneIds.map(sceneId => (sceneIndex.scenes || []).find(scene => scene.id === sceneId));
    const selectedRules = selectedRuleIds.map(ruleId => (ruleCatalog.rules || []).find(rule => rule.id === ruleId));
    const selectedSkills = selectedSkillIds.map(skillId => (skillCatalog.skills || []).find(skill => skill.id === skillId));

    printProjectPlan(draftProject, selectedSceneIds, selectedRuleIds, selectedSkillIds);
    if (flags['dry-run']) {
      console.log('\ndry-run: no files were written');
      return;
    }
    let confirmAiConfigsMigration = Boolean(flags.yes);
    if (!fs.existsSync(path.join(projectPath, '.ai-configs'))) {
      console.log(`\nDevFlow will create ${path.join(projectPath, '.ai-configs/project.md')} and keep project docs/rules/skills in the business repository.`);
      confirmAiConfigsMigration = await promptConfirm(rl, 'Create .ai-configs/project.md for this project', Boolean(flags.yes));
    }
    const confirmed = await promptConfirm(rl, 'Write project config and relationship indexes', Boolean(flags.yes));
    if (!confirmed) {
      console.log('aborted');
      return;
    }

    const configPath = `config/projects/${id}.json`;
    if (!flags.force) {
      for (const relativePath of [configPath]) {
        if (fs.existsSync(path.join(root, relativePath))) {
          throw new Error(`refusing to overwrite existing file without --force: ${relativePath}`);
        }
      }
      if ((projectIndex.projects || []).some(project => project.id === id)) {
        throw new Error(`project already exists in index without --force: ${id}`);
      }
    }

    const result = await runAction({
      rootDir: root,
      actionId: 'add_project_from_path',
      body: {
        projectPath,
        projectId: id,
        name,
        technologyFamilyId,
        repoType,
        summary,
        tags: finalTags,
        confirmAiConfigsMigration,
      },
    });
    if (!result.ok) {
      throw new Error(result.error?.message || result.summary || 'add_project_from_path failed');
    }

    const writtenProject = readJson(configPath);
    writtenProject.scenes = uniqueSortedMounts([
      ...(writtenProject.scenes || []),
      ...selectedScenes.map(makeSceneMount),
    ]);
    writtenProject.skills = uniqueSortedMounts([
      ...(writtenProject.skills || []),
      ...selectedSkills.map(makeSkillMount),
    ]);
    writtenProject.rules = uniqueSortedMounts([
      ...(writtenProject.rules || []),
      ...selectedRules.map(makeRuleMount),
    ]);
    if (writtenProject.readPolicy?.onDemandRead) {
      writtenProject.readPolicy.onDemandRead = uniqueSorted([
        ...writtenProject.readPolicy.onDemandRead,
        ...selectedScenes.map(scene => scene.sourcePath).filter(Boolean),
        ...selectedRules.map(rule => rule.sourcePath).filter(Boolean),
        ...selectedSkills.map(skill => skill.sourcePath).filter(Boolean),
      ]);
    }
    writeJson(configPath, writtenProject);
    updateSelectedScenes(draftProject, selectedScenes);
    updateRuleCatalog(draftProject, selectedRuleIds, selectedSceneIds);

    execFileSync(process.execPath, ['scripts/install-ai-context.mjs', 'validate'], {
      cwd: root,
      stdio: 'inherit',
    });
    if (flags['sync-projects']) {
      execFileSync(process.execPath, ['scripts/install-ai-context.mjs', 'sync-projects', '--write'], {
        cwd: root,
        stdio: 'inherit',
      });
    }
    console.log(`created project: ${id}`);
  } finally {
    rl?.close();
  }
}

async function addSkill(positionals, flags) {
  const skillCatalog = readJson('config/skills/skills.json');
  const sceneIndex = readJson('config/scenes/index.json');
  const projectIndex = readJson('config/projects/index.json');
  const interactive = Boolean(process.stdin.isTTY && !flags.yes);
  const rl = interactive ? createInterface({ input, output }) : null;

  try {
    if (!interactive && !flags.yes) {
      throw new Error('non-interactive add skill requires --yes');
    }

    const inputPath = flags.path || positionals[0] || '';
    const promptedPath = await promptText(rl, 'Skill directory', inputPath);
    if (!promptedPath) throw new Error('skill directory is required');
    const skillDir = path.resolve(root, promptedPath);
    const skillFile = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) throw new Error(`missing SKILL.md: ${skillFile}`);

    const frontmatter = readSkillFrontmatter(skillFile);
    const inferredId = normalizeProjectId(flags.id || frontmatter.name || path.basename(skillDir));
    const id = normalizeProjectId(await promptText(rl, 'Skill id', inferredId));
    const name = await promptText(rl, 'Skill name', flags.name || frontmatter.name || id);
    const description = await promptText(rl, 'Description', flags.description || frontmatter.description || `Use when ${name} is needed.`);
    const trigger = await promptText(rl, 'Trigger', flags.trigger || description);
    const tags = uniqueSorted(listFromFlag(flags.tags));
    const promptedTags = await promptText(rl, 'Tags comma list', tags.join(','));
    const finalTags = uniqueSorted(listFromFlag(promptedTags));
    const defaultSceneIds = listFromFlag(flags.scenes);
    const selectedSceneIds = await promptMulti(rl, 'Default scenes', sceneIndex.scenes || [], defaultSceneIds);
    ensureKnownIds('scene', selectedSceneIds, sceneIndex.scenes || []);

    const family = flags.family || '';
    const explicitProjectIds = listFromFlag(flags.projects);
    const familyProjectIds = family
      ? (projectIndex.projects || [])
        .filter(item => item.technologyFamilyId === family)
        .map(item => item.id)
      : [];
    const selectedProjectIds = uniqueSorted([...explicitProjectIds, ...familyProjectIds]);
    ensureKnownIds('project', selectedProjectIds, projectIndex.projects || []);

    const skill = {
      id,
      name,
      description,
      trigger,
      sourcePath: `${relativeToRoot(skillDir)}/SKILL.md`,
      tags: finalTags,
      defaultSceneIds: selectedSceneIds,
      whenToLoad: trigger,
      sourceExists: true,
      sourceType: 'file',
    };

    console.log('\nSkill plan');
    console.log(`  id: ${skill.id}`);
    console.log(`  name: ${skill.name}`);
    console.log(`  sourcePath: ${skill.sourcePath}`);
    console.log(`  tags: ${skill.tags.join(', ') || 'none'}`);
    console.log(`  default scenes: ${skill.defaultSceneIds.join(', ') || 'none'}`);
    console.log(`  mounted projects: ${selectedProjectIds.join(', ') || 'none'}`);

    const confirmed = await promptConfirm(rl, 'Write skill catalog and project mounts', Boolean(flags.yes));
    if (!confirmed) {
      console.log('aborted');
      return;
    }

    upsertSkillCatalog(skillCatalog, skill, Boolean(flags.force));
    writeJson('config/skills/skills.json', skillCatalog);
    mountSkillToProjects(skill, selectedProjectIds);

    execFileSync(process.execPath, ['scripts/install-ai-context.mjs', 'validate'], {
      cwd: root,
      stdio: 'inherit',
    });
    console.log(`registered skill: ${id}`);
  } finally {
    rl?.close();
  }
}

async function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const [command, type, ...rest] = positionals;
  if (!command || command === 'help' || command === '-h' || command === '--help') {
    usage();
    return;
  }
  if (command === 'doctor') {
    doctor();
    return;
  }
  if (command === 'task' && type === 'start') {
    await taskStart(rest, flags);
    return;
  }
  if (command === 'task' && type === 'update') {
    await taskUpdate(rest, flags);
    return;
  }
  if (command === 'task' && type === 'artifact') {
    await taskArtifact(rest, flags);
    return;
  }
  if (command === 'task' && type === 'finish') {
    await taskFinish(rest, flags);
    return;
  }
  if (command === 'add' && type === 'project') {
    await addProject(rest, flags);
    return;
  }
  if (command === 'add' && type === 'skill') {
    await addSkill(rest, flags);
    return;
  }
  usage();
  process.exit(1);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
