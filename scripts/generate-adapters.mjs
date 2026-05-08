#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const installScript = path.join(root, 'scripts', 'install-ai-context.mjs');

const commandMap = {
  check: 'check',
  install: 'install',
  uninstall: 'uninstall',
  'sync-projects': 'sync-projects',
  validate: 'validate',
};

const requestedCommand = process.argv[2] || 'validate';
const forwardedCommand = commandMap[requestedCommand];

if (!forwardedCommand) {
  console.error(`scripts/generate-adapters.mjs is deprecated.

Use one of:
  node scripts/install-ai-context.mjs check
  node scripts/install-ai-context.mjs validate
  node scripts/install-ai-context.mjs install
  node scripts/install-ai-context.mjs uninstall
  node scripts/install-ai-context.mjs sync-projects
`);
  process.exit(1);
}

console.warn(`scripts/generate-adapters.mjs is deprecated; forwarding to install-ai-context.mjs ${forwardedCommand}.`);

const result = spawnSync(process.execPath, [installScript, forwardedCommand], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
