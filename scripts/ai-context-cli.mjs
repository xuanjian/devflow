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
  ai-context init
  ai-context init --tools codex,claude-code,cursor
  ai-context init --tools codex,qoderwork --skip-openspec

Options:
  --tools <ids>       Comma-separated AI tools. Available: ${toolProviders.map(tool => tool.id).join(', ')}
  --yes               Non-interactive confirmation.
  --root <path>       ai-context checkout path. Defaults to current directory when it is an ai-context checkout.
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

function isAiContextRoot(candidateRoot) {
  return fs.existsSync(path.join(candidateRoot, 'config', 'entry.json'))
    && fs.existsSync(path.join(candidateRoot, 'scripts', 'install-ai-context.mjs'));
}

function resolveRoot(flags) {
  const explicitRoot = flags.root && flags.root !== true ? path.resolve(String(flags.root)) : undefined;
  if (explicitRoot) {
    if (!isAiContextRoot(explicitRoot)) throw new Error(`not an ai-context checkout: ${explicitRoot}`);
    return explicitRoot;
  }
  const cwd = process.cwd();
  if (isAiContextRoot(cwd)) return cwd;
  if (isAiContextRoot(packageRoot)) return packageRoot;
  throw new Error('run ai-context init from an ai-context checkout, or pass --root <path>');
}

function skillHomesForTools(toolIds, homeDir) {
  return toolIds.map(id => path.join(homeDir, providerById(id).skillDir));
}

function renderToolSelect(cursorIndex, selectedIds) {
  process.stdout.write('\x1Bc');
  console.log('Welcome to ai-context!');
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
  console.log(`ai-context root: ${root}`);
  if (flags['skip-openspec']) {
    console.log('OpenSpec install skipped.');
  } else {
    console.log('OpenSpec checked or installed.');
  }
  console.log('Next: run ai-context-init in your AI tool for local project/profile onboarding.');
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
