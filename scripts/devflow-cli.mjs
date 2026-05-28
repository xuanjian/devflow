#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';
import { execFileSync } from 'node:child_process';
import {
  normalizeCommandResult,
  normalizeQueryRouteResult,
  normalizeSceneTemplate,
  normalizeWorkset,
} from '../src/core/contracts/devflow-types.mjs';

const packageRoot = path.resolve(new URL('..', import.meta.url).pathname);
const serviceModulePath = path.join(packageRoot, 'src/core/services/devflow-service.mjs');

const toolProviders = [
  { id: 'codex', label: 'Codex', skillDir: '.codex/skills' },
  { id: 'claude-code', label: 'Claude Code', skillDir: '.claude/skills' },
  { id: 'cursor', label: 'Cursor', skillDir: '.cursor/skills' },
  { id: 'qoderwork', label: 'QoderWork', skillDir: '.qoderwork/skills' },
  { id: 'opencode', label: 'OpenCode', skillDir: '.opencode/skills' },
  { id: 'workbuddy', label: 'WorkBuddy', skillDir: '.workbuddy/skills' },
];

function usage() {
  console.log(`Usage:
  devflow init
  devflow init --tools codex,claude-code,cursor
  devflow init --dir ~/.local/share/devflow --tools codex
  devflow init --tools codex,qoderwork --skip-openspec
  devflow status
  devflow query route "<request>"
  devflow query current
  devflow query skills --project <id>
  devflow query skills --workset <task-or-workset-id>
  devflow query rules --template <id>
  devflow graph
  devflow migrate from-json [--dry-run] [--keep-json]
  devflow task current
  devflow task start "<title>" --project <id> --template <id>
  devflow task update <task-id> --gate <G1-G7> --note "<progress>"
  devflow add project <repo-path>
  devflow add scene-template "<name>"
  devflow doctor
  devflow index rebuild

Options:
  --tools <ids>       Comma-separated AI tools. Available: ${toolProviders.map(tool => tool.id).join(', ')}
  --yes               Non-interactive confirmation.
  --dir <path>        Local DevFlow directory to create or reuse. Defaults to ./devflow outside a checkout.
  --root <path>       Existing DevFlow checkout path. Alias for --dir during init.
  --skip-openspec     Do not install OpenSpec during init.
  --help              Show help.
`);
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

function parseToolIds(value) {
  if (!value || value === true) return [];
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function providerById(id) {
  return toolProviders.find(tool => tool.id === id);
}

function ensureKnownTools(toolIds) {
  const unknown = toolIds.filter(id => !providerById(id));
  if (unknown.length) throw new Error(`unknown AI tool(s): ${unknown.join(', ')}`);
}

function isDevFlowRoot(candidateRoot) {
  return (
    fs.existsSync(path.join(candidateRoot, 'config', 'entry.json'))
    || fs.existsSync(path.join(candidateRoot, 'data', 'devflow.db'))
  ) && fs.existsSync(path.join(candidateRoot, 'scripts', 'install-ai-context.mjs'));
}

function isDevFlowDataRoot(candidateRoot) {
  return fs.existsSync(path.join(candidateRoot, 'data', 'devflow.db'))
    || (
      fs.existsSync(path.join(candidateRoot, 'config', 'entry.json'))
      && fs.existsSync(path.join(candidateRoot, 'runtime', 'current.json'))
    );
}

function isDirectoryEmpty(directoryPath) {
  if (!fs.existsSync(directoryPath)) return true;
  return fs.statSync(directoryPath).isDirectory() && fs.readdirSync(directoryPath).length === 0;
}

function shouldSkipTemplateEntry(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  if (!normalized) return false;
  return [
    '.git',
    'node_modules',
    '.playwright-mcp',
    '.superpowers',
    'dist',
    'package-lock.json',
  ].some(skipPath => normalized === skipPath || normalized.startsWith(`${skipPath}/`))
    || normalized.endsWith('.tgz')
    || normalized.endsWith('.tmp')
    || normalized.endsWith('.swp')
    || normalized.includes('/.DS_Store')
    || normalized === '.DS_Store';
}

function copyTemplateDirectory(sourceDir, targetDir, relativeBase = '') {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeBase, entry.name);
    if (shouldSkipTemplateEntry(relativePath)) continue;
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyTemplateDirectory(sourcePath, targetPath, relativePath);
    } else if (entry.isSymbolicLink()) {
      fs.symlinkSync(fs.readlinkSync(sourcePath), targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      fs.chmodSync(targetPath, fs.statSync(sourcePath).mode);
    }
  }
}

function ensureLocalRoot(targetRoot) {
  if (isDevFlowRoot(targetRoot)) return targetRoot;
  if (fs.existsSync(targetRoot) && !isDirectoryEmpty(targetRoot)) {
    throw new Error(`target directory is not empty and is not a DevFlow checkout: ${targetRoot}`);
  }
  copyTemplateDirectory(packageRoot, targetRoot);
  if (!isDevFlowRoot(targetRoot)) throw new Error(`failed to create DevFlow checkout: ${targetRoot}`);
  return targetRoot;
}

function ensurePublicNpmRegistryConfig(targetRoot) {
  const npmrcPath = path.join(targetRoot, '.npmrc');
  const publicRegistryLine = 'registry=https://registry.npmjs.org/';
  if (!fs.existsSync(npmrcPath)) {
    fs.writeFileSync(npmrcPath, `${publicRegistryLine}\n`);
    return;
  }

  const current = fs.readFileSync(npmrcPath, 'utf8');
  const next = /^registry\s*=.*$/m.test(current)
    ? current.replace(/^registry\s*=.*$/m, publicRegistryLine)
    : `${current.trimEnd()}\n${publicRegistryLine}\n`;
  if (next !== current) fs.writeFileSync(npmrcPath, next);
}

function resolveRoot(flags) {
  const explicitDir = flags.dir && flags.dir !== true ? path.resolve(String(flags.dir)) : undefined;
  const explicitRoot = flags.root && flags.root !== true ? path.resolve(String(flags.root)) : undefined;
  const explicitTarget = explicitDir || explicitRoot;
  if (explicitTarget) {
    const root = ensureLocalRoot(explicitTarget);
    ensurePublicNpmRegistryConfig(root);
    return root;
  }
  const cwd = process.cwd();
  if (isDevFlowRoot(cwd)) {
    ensurePublicNpmRegistryConfig(cwd);
    return cwd;
  }
  const root = ensureLocalRoot(path.join(cwd, 'devflow'));
  ensurePublicNpmRegistryConfig(root);
  return root;
}

function skillHomesForTools(toolIds, homeDir) {
  return toolIds.map(id => path.join(homeDir, providerById(id).skillDir));
}

function renderToolSelect(cursorIndex, selectedIds) {
  process.stdout.write('\x1Bc');
  console.log('Welcome to DevFlow!');
  console.log('');
  console.log('Which AI tools do you want to configure?');
  console.log('Use Up/Down to move, Space to toggle, Enter to continue.');
  console.log('');
  for (let index = 0; index < toolProviders.length; index += 1) {
    const tool = toolProviders[index];
    const cursor = index === cursorIndex ? '>' : ' ';
    const selected = selectedIds.has(tool.id) ? '●' : '○';
    console.log(`${cursor} ${selected} ${tool.label}`);
  }
}

function selectToolsInteractively() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('no interactive terminal detected; pass --tools <ids>');
  }

  return new Promise(resolve => {
    let cursorIndex = 0;
    const selectedIds = new Set();
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    renderToolSelect(cursorIndex, selectedIds);

    function finish() {
      process.stdin.setRawMode(false);
      process.stdin.off('keypress', onKeypress);
      process.stdout.write('\n');
      resolve([...selectedIds]);
    }

    function onKeypress(_str, key) {
      if (key.ctrl && key.name === 'c') {
        process.stdin.setRawMode(false);
        process.exit(130);
      }
      if (key.name === 'up' || key.name === 'k') {
        cursorIndex = (cursorIndex - 1 + toolProviders.length) % toolProviders.length;
      } else if (key.name === 'down' || key.name === 'j') {
        cursorIndex = (cursorIndex + 1) % toolProviders.length;
      } else if (key.name === 'space') {
        const id = toolProviders[cursorIndex].id;
        if (selectedIds.has(id)) selectedIds.delete(id);
        else selectedIds.add(id);
      } else if (key.name === 'return') {
        finish();
        return;
      }
      renderToolSelect(cursorIndex, selectedIds);
    }

    process.stdin.on('keypress', onKeypress);
  });
}

function runInit(root, toolIds, flags) {
  ensureKnownTools(toolIds);
  if (!toolIds.length) throw new Error('select at least one AI tool');

  const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
  const skillHomes = skillHomesForTools(toolIds, homeDir);
  const selectedLabels = toolIds.map(id => providerById(id).label);
  const installArgs = ['scripts/install-ai-context.mjs', 'setup'];
  if (!flags['skip-openspec']) installArgs.push('--install-openspec');

  execFileSync(process.execPath, installArgs, {
    cwd: root,
    env: {
      ...process.env,
      AI_CONTEXT_SKILLS_HOMES: skillHomes.join(','),
    },
    stdio: 'pipe',
  });

  console.log(`Selected AI tools: ${selectedLabels.join(', ')}`);
  console.log(`Configured ${skillHomes.length} skill target(s).`);
  console.log(`DevFlow root: ${root}`);
  if (flags['skip-openspec']) {
    console.log('OpenSpec install skipped.');
  } else {
    console.log('OpenSpec checked or installed.');
  }
  console.log('Next: run devflow-init in your AI tool for local project/profile onboarding.');
}

function resolveExistingRoot(flags) {
  const explicitRoot = flags.root && flags.root !== true ? path.resolve(String(flags.root)) : undefined;
  const explicitDir = flags.dir && flags.dir !== true ? path.resolve(String(flags.dir)) : undefined;
  const root = explicitRoot || explicitDir || process.cwd();
  if (!isDevFlowRoot(root) && !isDevFlowDataRoot(root)) throw new Error(`not a DevFlow checkout: ${root}`);
  return root;
}

async function createService(rootDir) {
  if (fs.existsSync(serviceModulePath)) {
    const serviceModule = await import(serviceModulePath);
    if (typeof serviceModule.createDevFlowService === 'function') {
      return serviceModule.createDevFlowService({ rootDir });
    }
  }
  return createCompatibilityService({ rootDir });
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function readRootJson(rootDir, relativePath, fallback = undefined) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing file: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeRootJson(rootDir, relativePath, value) {
  const filePath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function nowIso() {
  return new Date().toISOString();
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function ensureGateId(gateId = 'G1') {
  if (!/^G[1-7]$/.test(gateId)) throw new Error(`invalid gate id: ${gateId}`);
  return gateId;
}

function listFromFlag(value) {
  if (!value || value === true) return [];
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function uniqueStable(values) {
  return [...new Set(values.filter(Boolean))];
}

function indexItems(rootDir, relativePath, key) {
  return readRootJson(rootDir, relativePath, { [key]: [] })[key] || [];
}

function readIndexRecord(rootDir, item) {
  if (item.path) return readRootJson(rootDir, item.path);
  return item;
}

function listProjects(rootDir) {
  return indexItems(rootDir, 'config/projects/index.json', 'projects').map(item => readIndexRecord(rootDir, item));
}

function listSceneTemplates(rootDir) {
  return indexItems(rootDir, 'config/scenes/index.json', 'scenes')
    .map(item => normalizeSceneTemplate(readIndexRecord(rootDir, item)));
}

function listSkills(rootDir) {
  return readRootJson(rootDir, 'config/skills/skills.json', { skills: [] }).skills || [];
}

function listRules(rootDir) {
  return readRootJson(rootDir, 'config/rules/rules.json', { rules: [] }).rules || [];
}

function listTasks(rootDir) {
  const tasksDir = path.join(rootDir, 'runtime/tasks');
  if (!fs.existsSync(tasksDir)) return [];
  return fs.readdirSync(tasksDir)
    .filter(name => name.endsWith('.json'))
    .map(name => readRootJson(rootDir, `runtime/tasks/${name}`));
}

function getTask(rootDir, taskId) {
  return readRootJson(rootDir, `runtime/tasks/${taskId}.json`);
}

function getActiveTask(rootDir) {
  const current = readRootJson(rootDir, 'runtime/current.json');
  if (!current.activeTaskId) return null;
  return getTask(rootDir, current.activeTaskId);
}

function getWorksetFromTask(task) {
  if (!task) return null;
  return normalizeWorkset(task.workset || {
    id: `workset-${task.id}`,
    taskId: task.id,
    sourceText: task.title || task.id,
    confidence: 'unknown',
    reason: 'Built from compatibility task projectIds and sceneIds.',
    sceneTemplateId: task.sceneIds?.[0],
    projects: (task.projectIds || []).map(id => ({ id, role: 'primary' })),
  });
}

function getWorkset(rootDir, worksetId) {
  const task = listTasks(rootDir).find(item => item.id === worksetId || item.workset?.id === worksetId);
  return getWorksetFromTask(task);
}

function getProjectIdsFromTemplate(rootDir, templateId) {
  const template = listSceneTemplates(rootDir).find(item => item.id === templateId);
  return [
    ...(template?.projectHints || []).map(item => item.id),
    ...(readRootJson(rootDir, `config/scenes/${templateId}.json`, { projects: [] }).projects || []).map(item => item.id),
  ].filter(Boolean);
}

function makeFilterContext(rootDir, filters = {}) {
  const projectIds = new Set();
  if (filters.projectId) projectIds.add(filters.projectId);
  if (filters.templateId) getProjectIdsFromTemplate(rootDir, filters.templateId).forEach(id => projectIds.add(id));
  const workset = filters.worksetId ? getWorkset(rootDir, filters.worksetId) : null;
  for (const project of workset?.projects || []) projectIds.add(project.id);
  const skillIds = new Set((workset?.skills || []).map(item => item.id));
  const ruleIds = new Set((workset?.rules || []).map(item => item.id));
  const template = filters.templateId ? listSceneTemplates(rootDir).find(item => item.id === filters.templateId) : null;
  for (const skill of template?.skillHints || []) skillIds.add(skill.id);
  for (const rule of template?.ruleHints || []) ruleIds.add(rule.id);
  return { projectIds, skillIds, ruleIds };
}

function createCompatibilityService({ rootDir }) {
  function queryCurrent() {
    const current = readRootJson(rootDir, 'runtime/current.json');
    const task = getActiveTask(rootDir);
    const workset = getWorksetFromTask(task);
    return {
      type: 'current',
      current,
      task,
      workset,
      nextAction: task?.recoveryPoint || current.note || '',
      recoveryPoint: task?.recoveryPoint || '',
      readPaths: [
        'runtime/current.json',
        ...(task ? [`runtime/tasks/${task.id}.json`] : []),
      ],
    };
  }

  function queryRoute({ text } = {}) {
    const templates = listSceneTemplates(rootDir);
    const projects = listProjects(rootDir);
    const selectedTemplate = templates.find(template => {
      const haystack = [template.id, template.name, template.summary].join(' ').toLowerCase();
      return String(text || '').toLowerCase().split(/\s+/).some(token => token && haystack.includes(token));
    }) || templates[0] || null;
    const projectIds = selectedTemplate?.projectHints?.map(item => item.id).filter(Boolean)
      || projects.slice(0, 1).map(project => project.id);

    return normalizeQueryRouteResult({
      mode: selectedTemplate || projectIds.length ? 'light' : 'none',
      sceneTemplate: selectedTemplate ? {
        ...selectedTemplate,
        confidence: 'medium',
        reason: 'Matched template keywords or project hints.',
      } : null,
      workset: {
        id: `workset-${slugify(text) || 'route'}`,
        sourceText: text || '',
        confidence: 'medium',
        reason: 'Matched project/template metadata.',
        sceneTemplateId: selectedTemplate?.id,
        projects: projectIds.map(id => ({ id, role: 'primary' })),
        capabilities: (selectedTemplate?.capabilityIds || []).map(id => ({ id })),
        skills: selectedTemplate?.skillHints || [],
        rules: selectedTemplate?.ruleHints || [],
      },
      skills: querySkills({ templateId: selectedTemplate?.id }).skills,
      rules: queryRules({ templateId: selectedTemplate?.id }).rules,
      readPaths: [
        'config/projects/index.json',
        'config/scenes/index.json',
      ],
      nextAction: 'Use returned readPaths and workset before loading additional source files.',
    });
  }

  function querySkills({ projectId, templateId, worksetId } = {}) {
    const context = makeFilterContext(rootDir, { projectId, templateId, worksetId });
    const skills = listSkills(rootDir).filter(skill => {
      if (context.skillIds.has(skill.id)) return true;
      if (!context.projectIds.size) return true;
      return (skill.projectIds || []).some(id => context.projectIds.has(id))
        || (skill.defaultProjectIds || []).some(id => context.projectIds.has(id));
    });
    return { type: 'skills', skills };
  }

  function queryRules({ projectId, templateId, worksetId } = {}) {
    const context = makeFilterContext(rootDir, { projectId, templateId, worksetId });
    const rules = listRules(rootDir).filter(rule => {
      if (context.ruleIds.has(rule.id)) return true;
      if (!context.projectIds.size && !templateId) return true;
      return (rule.projectIds || []).some(id => context.projectIds.has(id))
        || (rule.sceneIds || []).includes(templateId);
    });
    return { type: 'rules', rules };
  }

  function buildGraph() {
    const nodes = [];
    const edges = [];
    for (const project of listProjects(rootDir)) nodes.push({ id: `project:${project.id}`, type: 'project', label: project.name || project.id });
    for (const template of listSceneTemplates(rootDir)) {
      nodes.push({ id: `sceneTemplate:${template.id}`, type: 'sceneTemplate', label: template.name || template.id });
      for (const project of template.projectHints || []) edges.push({ from: `sceneTemplate:${template.id}`, to: `project:${project.id}`, type: 'projectHint' });
    }
    for (const skill of listSkills(rootDir)) nodes.push({ id: `skill:${skill.id}`, type: 'skill', label: skill.name || skill.id });
    for (const rule of listRules(rootDir)) nodes.push({ id: `rule:${rule.id}`, type: 'rule', label: rule.name || rule.id });
    for (const task of listTasks(rootDir)) {
      const workset = getWorksetFromTask(task);
      nodes.push({ id: `task:${task.id}`, type: 'task', label: task.title || task.id });
      if (workset) {
        nodes.push({ id: `workset:${workset.id}`, type: 'workset', label: workset.id });
        edges.push({ from: `task:${task.id}`, to: `workset:${workset.id}`, type: 'hasWorkset' });
        for (const project of workset.projects || []) edges.push({ from: `workset:${workset.id}`, to: `project:${project.id}`, type: 'project' });
      }
    }
    return { type: 'graph', nodes, edges };
  }

  function taskIdFromTitle(title, flags = {}) {
    return slugify(flags.id || `${todayString()}-${title}`);
  }

  function writeCurrentForTask(task) {
    const current = readRootJson(rootDir, 'runtime/current.json', { version: 1 });
    current.activeTaskId = task.id;
    current.activeTaskPath = `runtime/tasks/${task.id}.json`;
    current.activeProjectIds = task.projectIds || [];
    current.activeSceneIds = task.sceneIds || [];
    current.activeWorksetId = task.workset?.id || '';
    current.currentGate = task.currentGate;
    current.recentTaskIds = uniqueStable([task.id, ...(current.recentTaskIds || [])]).slice(0, 20);
    current.note = 'Current work is stored in task JSON. runtime/current-work.md is deprecated.';
    writeRootJson(rootDir, 'runtime/current.json', current);
  }

  function startTask({ title, taskId, projectIds = [], templateId, gate = 'G1', level, note } = {}) {
    if (!title) throw new Error('task title is required');
    const id = slugify(taskId) || taskIdFromTitle(title);
    const currentGate = ensureGateId(gate);
    const timestamp = nowIso();
    const task = {
      version: 1,
      id,
      title,
      status: 'active',
      taskLevel: level,
      currentGate,
      projectIds,
      sceneIds: templateId ? [templateId] : [],
      workset: normalizeWorkset({
        id: `workset-${id}`,
        taskId: id,
        sourceText: title,
        confidence: 'medium',
        reason: 'Created from CLI task start arguments.',
        sceneTemplateId: templateId,
        projects: projectIds.map(projectId => ({ id: projectId, role: 'primary' })),
      }),
      notes: note ? [{ at: timestamp, gate: currentGate, text: String(note) }] : [],
      blockers: [],
      artifacts: [],
      recoveryPoint: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    writeRootJson(rootDir, `runtime/tasks/${id}.json`, task);
    writeCurrentForTask(task);
    return normalizeCommandResult({ status: 'ok', action: 'startTask', entityType: 'task', entityId: id, paths: [`runtime/tasks/${id}.json`, 'runtime/current.json'] });
  }

  function updateTask({ taskId, gate, note, recoveryPoint } = {}) {
    if (!taskId) throw new Error('task id is required');
    const task = getTask(rootDir, taskId);
    if (gate) task.currentGate = ensureGateId(gate);
    if (recoveryPoint) task.recoveryPoint = recoveryPoint;
    if (note) {
      task.notes = task.notes || [];
      task.notes.push({ at: nowIso(), gate: task.currentGate, text: String(note) });
    }
    task.updatedAt = nowIso();
    writeRootJson(rootDir, `runtime/tasks/${taskId}.json`, task);
    writeCurrentForTask(task);
    return normalizeCommandResult({ status: 'ok', action: 'updateTask', entityType: 'task', entityId: taskId, paths: [`runtime/tasks/${taskId}.json`, 'runtime/current.json'] });
  }

  function finishTask({ taskId, note } = {}) {
    const task = getTask(rootDir, taskId);
    task.status = 'done';
    task.currentGate = 'G7';
    if (note) {
      task.notes = task.notes || [];
      task.notes.push({ at: nowIso(), gate: 'G7', text: String(note) });
    }
    task.updatedAt = nowIso();
    writeRootJson(rootDir, `runtime/tasks/${taskId}.json`, task);
    writeCurrentForTask(task);
    return normalizeCommandResult({ status: 'ok', action: 'finishTask', entityType: 'task', entityId: taskId, paths: [`runtime/tasks/${taskId}.json`] });
  }

  function addProject({ projectPath, projectId, name, technologyFamilyId } = {}) {
    const absolutePath = path.resolve(projectPath || '');
    const id = slugify(projectId || path.basename(absolutePath));
    const project = {
      version: 1,
      id,
      name: name || path.basename(absolutePath),
      technologyFamilyId: technologyFamilyId || 'unknown',
      repoType: 'repository',
      summary: `${name || path.basename(absolutePath)} project.`,
      path: absolutePath,
      tags: [technologyFamilyId || 'unknown'],
      scenes: [],
      skills: [],
      rules: [],
    };
    const index = readRootJson(rootDir, 'config/projects/index.json', { version: 1, projects: [] });
    const item = { id, name: project.name, technologyFamilyId: project.technologyFamilyId, path: `config/projects/${id}.json`, summary: project.summary };
    index.projects = [...(index.projects || []).filter(existing => existing.id !== id), item].sort((a, b) => a.id.localeCompare(b.id));
    writeRootJson(rootDir, 'config/projects/index.json', index);
    writeRootJson(rootDir, `config/projects/${id}.json`, project);
    return normalizeCommandResult({ status: 'ok', action: 'addProject', entityType: 'project', entityId: id, paths: ['config/projects/index.json', `config/projects/${id}.json`] });
  }

  function addSceneTemplate({ templateId, name, summary, capabilityIds = [], projectHints = [] } = {}) {
    const id = slugify(templateId || name);
    if (!id) throw new Error('scene template name is required');
    const template = normalizeSceneTemplate({ id, name, summary, capabilityIds, projectHints, sourcePath: `docs/scenes/${id}.md` });
    const index = readRootJson(rootDir, 'config/scenes/index.json', { version: 1, scenes: [] });
    const item = { id, name: template.name, path: `config/scenes/${id}.json`, summary: template.summary };
    index.scenes = [...(index.scenes || []).filter(existing => existing.id !== id), item].sort((a, b) => a.id.localeCompare(b.id));
    writeRootJson(rootDir, 'config/scenes/index.json', index);
    writeRootJson(rootDir, `config/scenes/${id}.json`, template);
    return normalizeCommandResult({ status: 'ok', action: 'addSceneTemplate', entityType: 'sceneTemplate', entityId: id, paths: ['config/scenes/index.json', `config/scenes/${id}.json`] });
  }

  return {
    queryRoute,
    queryCurrent,
    querySkills,
    queryRules,
    buildGraph,
    startTask,
    updateTask,
    finishTask,
    addProject,
    addSceneTemplate,
  };
}

function firstValue(...values) {
  return values.find(value => value && value !== true);
}

async function runFacadeCommand(root, command, type, rest, flags) {
  const service = await createService(root);
  if (command === 'status') {
    printJson(await service.queryCurrent());
    return;
  }
  if (command === 'query' && type === 'route') {
    printJson(await service.queryRoute({ text: rest.join(' ') }));
    return;
  }
  if (command === 'query' && type === 'current') {
    printJson(await service.queryCurrent());
    return;
  }
  if (command === 'query' && type === 'skills') {
    printJson(await service.querySkills({
      projectId: firstValue(flags.project, flags.projects),
      templateId: firstValue(flags.template, flags.scene),
      worksetId: firstValue(flags.workset),
    }));
    return;
  }
  if (command === 'query' && type === 'rules') {
    printJson(await service.queryRules({
      projectId: firstValue(flags.project, flags.projects),
      templateId: firstValue(flags.template, flags.scene),
      worksetId: firstValue(flags.workset),
    }));
    return;
  }
  if (command === 'graph') {
    printJson(await service.buildGraph());
    return;
  }
  if (command === 'migrate' && type === 'from-json') {
    const module = await import('../src/core/storage/migrate-from-json.mjs');
    printJson(await module.migrateDevFlowFromJson({
      rootDir: root,
      dryRun: Boolean(flags['dry-run']),
      keepJson: Boolean(flags['keep-json']),
    }));
    return;
  }
  if (command === 'task' && type === 'current') {
    printJson(await service.queryCurrent());
    return;
  }
  if (command === 'task' && type === 'start') {
    const title = flags.title || rest.join(' ').trim();
    printJson(await service.startTask({
      title,
      taskId: firstValue(flags.id),
      projectIds: uniqueStable([...listFromFlag(flags.project), ...listFromFlag(flags.projects)]),
      templateId: firstValue(flags.template, flags.scene, flags.scenes),
      gate: firstValue(flags.gate),
      level: firstValue(flags.level),
      note: firstValue(flags.note),
    }));
    return;
  }
  if (command === 'task' && type === 'update') {
    printJson(await service.updateTask({
      taskId: rest[0],
      gate: firstValue(flags.gate),
      note: firstValue(flags.note),
      recoveryPoint: firstValue(flags.recovery, flags.recoveryPoint),
    }));
    return;
  }
  if (command === 'task' && type === 'finish') {
    printJson(await service.finishTask({ taskId: rest[0], note: firstValue(flags.note) }));
    return;
  }
  if (command === 'add' && type === 'project') {
    printJson(await service.addProject({
      projectPath: flags.path || rest[0],
      projectId: firstValue(flags.id),
      name: firstValue(flags.name),
      technologyFamilyId: firstValue(flags.family, flags.technologyFamilyId),
    }));
    return;
  }
  if (command === 'add' && type === 'scene-template') {
    const name = flags.name || rest.join(' ').trim();
    printJson(await service.addSceneTemplate({
      templateId: firstValue(flags.id, flags.template) || slugify(name),
      name,
      summary: firstValue(flags.summary),
      capabilityIds: listFromFlag(flags.capabilities),
      projectHints: listFromFlag(flags.project || flags.projects).map(id => ({ id })),
    }));
    return;
  }
  if (command === 'doctor') {
    const dbPath = path.join(root, 'data/devflow.db');
    const dbExists = fs.existsSync(dbPath);
    printJson(normalizeCommandResult({
      status: dbExists ? 'ok' : 'noop',
      action: 'doctor',
      entityType: undefined,
      message: dbExists ? 'DevFlow SQLite index is available.' : 'SQLite index missing. Run devflow index rebuild.',
      paths: dbExists ? ['data/devflow.db'] : [],
      warnings: dbExists ? [] : [{ code: 'missing_sqlite_index', command: 'devflow index rebuild' }]
    }));
    return;
  }
  if (command === 'index' && type === 'rebuild') {
    const module = await import('../src/core/storage/rebuild-index.mjs');
    printJson(await module.rebuildDevFlowIndex({ rootDir: root }));
    return;
  }
  usage();
  process.exit(1);
}

async function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const command = positionals[0];
  if (!command || command === 'help' || flags.help || flags.h) {
    usage();
    return;
  }
  if (command === 'init') {
    const root = resolveRoot(flags);
    const selectedToolIds = parseToolIds(flags.tools);
    const toolIds = selectedToolIds.length ? selectedToolIds : await selectToolsInteractively();
    runInit(root, toolIds, flags);
    return;
  }

  const root = resolveExistingRoot(flags);
  const [, type, ...rest] = positionals;
  await runFacadeCommand(root, command, type, rest, flags);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
