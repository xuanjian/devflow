#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';
import { execFileSync } from 'node:child_process';

const packageRoot = path.resolve(new URL('..', import.meta.url).pathname);

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

Options:
  --tools <ids>       Comma-separated AI tools. Available: ${toolProviders.map(tool => tool.id).join(', ')}
  --yes               Non-interactive confirmation.
  --dir <path>        Local DevFlow directory to create or reuse. Defaults to ./devflow outside a checkout.
  --root <path>       Existing DevFlow checkout path. Alias for --dir when the path already exists.
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
  return fs.existsSync(path.join(candidateRoot, 'config', 'entry.json'))
    && fs.existsSync(path.join(candidateRoot, 'scripts', 'install-ai-context.mjs'));
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

async function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const command = positionals[0];
  if (!command || command === 'help' || flags.help || flags.h) {
    usage();
    return;
  }
  if (command !== 'init') {
    usage();
    process.exit(1);
  }

  const root = resolveRoot(flags);
  const selectedToolIds = parseToolIds(flags.tools);
  const toolIds = selectedToolIds.length ? selectedToolIds : await selectToolsInteractively();
  runInit(root, toolIds, flags);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
