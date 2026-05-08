#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn, execSync } = require('child_process');
const { buildExecutionPlan } = require('./run-projects.core');
const config = require('./presets.json');

const SKILL_DIR = path.resolve(__dirname, '..');
const RUNTIME_DIR = path.join(SKILL_DIR, 'runtime');
const BACKUP_DIR = path.join(RUNTIME_DIR, 'backups');
const LOG_DIR = path.join(RUNTIME_DIR, 'logs');
const PID_DIR = path.join(RUNTIME_DIR, 'pids');

function parseArgs(argv) {
  const args = {
    dryRun: false,
    restore: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];

    if (part === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (part === '--restore') {
      args.restore = true;
      continue;
    }

    if (part.indexOf('--') === 0) {
      const key = part.replace(/^--/, '');
      const value = argv[index + 1];
      args[key] = value;
      index += 1;
    }
  }

  return args;
}

function ensureRuntimeLayout() {
  [RUNTIME_DIR, BACKUP_DIR, LOG_DIR, PID_DIR].forEach((dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function getBackupPath(backupKey) {
  return path.join(BACKUP_DIR, `${backupKey}.bak`);
}

function ensureBackup(mutation, dryRun) {
  const backupPath = getBackupPath(mutation.backupKey);

  if (!dryRun && !fs.existsSync(backupPath)) {
    fs.copyFileSync(mutation.path, backupPath);
  }

  return backupPath;
}

function restoreMutation(mutation, dryRun) {
  const backupPath = ensureBackup(mutation, dryRun);
  if (!dryRun && fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, mutation.path);
  }

  return {
    type: 'restore',
    file: mutation.path,
    backup: backupPath,
  };
}

function snapshotMutation(mutation, dryRun) {
  const backupPath = getBackupPath(mutation.backupKey);

  if (!dryRun) {
    fs.copyFileSync(mutation.path, backupPath);
  }

  return {
    type: 'snapshot',
    file: mutation.path,
    backup: backupPath,
  };
}

function restoreBaseline(dryRun, mutationKeys) {
  const keys = Array.isArray(mutationKeys) && mutationKeys.length
    ? mutationKeys
    : Object.keys(config.mutations);
  return keys.map((key) => restoreMutation(config.mutations[key], dryRun));
}

function snapshotBaseline(dryRun, mutationKeys) {
  const keys = Array.isArray(mutationKeys) && mutationKeys.length
    ? mutationKeys
    : Object.keys(config.mutations);
  return keys.map((key) => snapshotMutation(config.mutations[key], dryRun));
}

function restoreAll(dryRun) {
  const actions = restoreBaseline(dryRun);
  stopManagedProcesses(dryRun);
  return actions;
}

function loadDomainConfig(filePath) {
  delete require.cache[require.resolve(filePath)];
  return require(filePath).domainConfig;
}

function writeDomainConfig(filePath, domainConfig) {
  const content = `module.exports.domainConfig = ${JSON.stringify(domainConfig, null, 2)}\n`;
  writeFile(filePath, content);
}

function deriveBaseHost(hostname) {
  if (hostname.endsWith('.newdhb.com')) {
    return hostname.replace(/\.newdhb\.com$/, '');
  }

  if (hostname.endsWith('.dhb168.com')) {
    return hostname.replace(/\.dhb168\.com$/, '').replace(/^y/, '');
  }

  return hostname;
}

function mapHostByEnvironment(rawUrl, envCode) {
  const match = String(rawUrl).match(/^(https?):\/\/([^/]+)(.*)?$/);

  if (!match) {
    return rawUrl;
  }

  const hostname = match[2];
  const suffix = match[3] || '';

  if (!hostname.endsWith('.newdhb.com') && !hostname.endsWith('.dhb168.com')) {
    return rawUrl;
  }

  const base = deriveBaseHost(hostname);

  if (envCode === 'test') {
    return `http://${base}.newdhb.com${suffix}`;
  }

  if (envCode === 'release' || envCode === 'demo') {
    return `https://y${base}.dhb168.com${suffix}`;
  }

  return `https://${base}.dhb168.com${suffix}`;
}

function transformDomainConfig(filePath, envCode, dryRun) {
  const domainConfig = loadDomainConfig(filePath);
  const nextConfig = {
    envCode,
    hosts: {},
  };

  Object.keys(domainConfig.hosts).forEach((key) => {
    nextConfig.hosts[key] = mapHostByEnvironment(domainConfig.hosts[key], envCode);
  });

  if (!dryRun) {
    writeDomainConfig(filePath, nextConfig);
  }

  return {
    type: 'domainConfig',
    file: filePath,
    envCode,
  };
}

function loadProjectConfig(filePath) {
  delete require.cache[require.resolve(filePath)];
  return require(filePath).projectConfig;
}

function writeProjectConfigModule(filePath, projectConfig) {
  const content = `module.exports.projectConfig = ${JSON.stringify(projectConfig, null, 2)}\n`;
  writeFile(filePath, content);
}

function mapConfigValueByEnvironment(value, envCode) {
  if (typeof value === 'string') {
    return mapHostByEnvironment(value, envCode);
  }

  if (Array.isArray(value)) {
    return value.map((item) => mapConfigValueByEnvironment(item, envCode));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = mapConfigValueByEnvironment(value[key], envCode);
      return acc;
    }, {});
  }

  return value;
}

function transformLocalProjectConfig(filePath, envCode, dryRun) {
  const projectConfig = loadProjectConfig(filePath);
  const nextConfig = mapConfigValueByEnvironment(projectConfig, envCode);

  if (!dryRun) {
    writeProjectConfigModule(filePath, nextConfig);
  }

  return {
    type: 'localProjectConfig',
    file: filePath,
    envCode,
  };
}

function transformMiniHome(filePath, enableLocalH5, dryRun) {
  let content = readFile(filePath);

  if (enableLocalH5) {
    content = content.replace(
      /(\s*)\/\/ app\.globalData\.path = 'http:\/\/127\.0\.0\.1:9009'/,
      "$1app.globalData.path = 'http://127.0.0.1:9009'"
    );
    content = content.replace(
      /(\s*)\/\/ domain = 'http:\/\/127\.0\.0\.1:9009'/,
      "$1domain = 'http://127.0.0.1:9009'"
    );
  }

  if (!enableLocalH5) {
    content = content.replace(
      /(\s*)app\.globalData\.path = 'http:\/\/127\.0\.0\.1:9009'/,
      "$1// app.globalData.path = 'http://127.0.0.1:9009'"
    );
    content = content.replace(
      /(\s*)domain = 'http:\/\/127\.0\.0\.1:9009'/,
      "$1// domain = 'http://127.0.0.1:9009'"
    );
  }

  if (!dryRun) {
    writeFile(filePath, content);
  }

  return {
    type: 'miniHome',
    file: filePath,
    enableLocalH5,
  };
}

function transformProjectConfig(filePath, miniBeforeCompile, dryRun) {
  const projectConfig = JSON.parse(readFile(filePath));
  projectConfig.scripts = projectConfig.scripts || {};
  projectConfig.scripts.beforeCompile = `node scripts/beforeCompile.js ${miniBeforeCompile}`;

  if (!dryRun) {
    writeFile(filePath, `${JSON.stringify(projectConfig, null, 2)}\n`);
  }

  return {
    type: 'projectConfig',
    file: filePath,
    beforeCompile: projectConfig.scripts.beforeCompile,
  };
}

function transformPackageJson(filePath, selectedSubpackages, dryRun) {
  const packageJson = JSON.parse(readFile(filePath));
  packageJson.devDependencies = packageJson.devDependencies || {};

  selectedSubpackages.forEach((subpackageKey) => {
    const subpackage = config.subpackages[subpackageKey];
    if (subpackage) {
      packageJson.devDependencies[subpackage.packageName] = `file:${subpackage.relativePath}`;
    }
  });

  if (!dryRun) {
    writeFile(filePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  }

  return {
    type: 'packageJson',
    file: filePath,
    selectedSubpackages,
  };
}

function transformConfigIndex(filePath, selectedSubpackages, dryRun) {
  let content = readFile(filePath);
  const entries = selectedSubpackages
    .map((subpackageKey) => config.subpackages[subpackageKey])
    .filter(Boolean)
    .map((subpackage) => subpackage.cssTransformPath)
    .filter(Boolean);

  if (entries.length) {
    const match = content.match(/const cssTransfromPaths = \[([\s\S]*?)\n\s*\]/);

    if (match) {
      let body = match[1];
      entries.forEach((entry) => {
        if (body.indexOf(entry) === -1) {
          body += `\n      "${entry}",`;
        }
      });
      content = content.replace(match[0], `const cssTransfromPaths = [${body}\n    ]`);
    }
  }

  if (!dryRun) {
    writeFile(filePath, content);
  }

  return {
    type: 'configIndex',
    file: filePath,
    selectedSubpackages,
  };
}

function runCommand(command, cwd, dryRun) {
  if (dryRun) {
    return;
  }

  execSync(command, {
    cwd,
    stdio: 'inherit',
  });
}

function ensureSubpackageBuilds(selectedSubpackages, dryRun) {
  const actions = [];

  selectedSubpackages.forEach((subpackageKey) => {
    const subpackage = config.subpackages[subpackageKey];
    if (!subpackage) {
      return;
    }

    const distPath = path.join(subpackage.absolutePath, 'dist');
    if (!fs.existsSync(distPath)) {
      runCommand(subpackage.buildCommand, subpackage.absolutePath, dryRun);
      actions.push({
        type: 'subpackageBuild',
        subpackage: subpackageKey,
        command: subpackage.buildCommand,
      });
    }
  });

  return actions;
}

function getPidPath(name) {
  return path.join(PID_DIR, `${name}.pid`);
}

function getLogPath(name) {
  return path.join(LOG_DIR, `${name}.log`);
}

function stopManagedProcesses(dryRun) {
  if (!fs.existsSync(PID_DIR)) {
    return [];
  }

  const actions = [];
  fs.readdirSync(PID_DIR).forEach((fileName) => {
    if (!fileName.endsWith('.pid')) {
      return;
    }

    const pidPath = path.join(PID_DIR, fileName);
    const pid = Number(readFile(pidPath).trim());

    actions.push({
      type: 'stopProcess',
      name: fileName.replace(/\.pid$/, ''),
      pid,
    });

    if (!dryRun) {
      try {
        try {
          process.kill(-pid, 'SIGTERM');
        } catch (error) {
          process.kill(pid, 'SIGTERM');
        }
      } catch (error) {
      }
      try {
        execSync(
          `/bin/zsh -lc 'sleep 1; kill -0 -${pid} >/dev/null 2>&1 && kill -KILL -${pid} >/dev/null 2>&1 || true; kill -0 ${pid} >/dev/null 2>&1 && kill -KILL ${pid} >/dev/null 2>&1 || true'`,
          { stdio: 'ignore' }
        );
      } catch (error) {
      }
      fs.unlinkSync(pidPath);
    }
  });

  return actions;
}

function startManagedProcess(name, cwd, command, dryRun) {
  const logPath = getLogPath(name);
  const pidPath = getPidPath(name);

  if (dryRun) {
    return {
      type: 'startProcess',
      name,
      cwd,
      command,
      logPath,
    };
  }

  const output = fs.openSync(logPath, 'w');
  const child = spawn('/bin/zsh', ['-c', command], {
    cwd,
    detached: true,
    env: process.env,
    stdio: ['ignore', output, output],
  });

  child.unref();
  fs.writeFileSync(pidPath, `${child.pid}\n`, 'utf8');

  return {
    type: 'startProcess',
    name,
    cwd,
    command,
    logPath,
    pid: child.pid,
  };
}

function resolveCashCommand(plan) {
  const repo = config.repos['dhbfront-cash-mini'];

  if (plan.cashMode.type !== 'subpackage') {
    return repo.commands.default;
  }

  const scriptFile = path.join(repo.cwd, 'scripts', 'watchSubpackagesAndPack.js');
  if (!fs.existsSync(scriptFile)) {
    throw new Error(
      `分包模式要求执行 ${repo.commands.subpackage}，但缺少脚本：${scriptFile}`
    );
  }

  return repo.commands.subpackage;
}

function waitForPort(port, timeoutMs) {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    function attempt() {
      const socket = net.createConnection({ port, host: '127.0.0.1' });

      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });

      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Timeout waiting for port ${port}`));
          return;
        }
        setTimeout(attempt, 1000);
      });
    }

    attempt();
  });
}

function waitForLogPattern(logPath, pattern, timeoutMs) {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    function attempt() {
      let content = '';
      try {
        content = readFile(logPath);
      } catch (error) {
      }

      if (pattern.test(content)) {
        resolve();
        return;
      }

      if (/\[watchSubpackages\] pack 或拷贝失败|✖ Errors:|Module not found|Cannot find module|resolve '@/.test(content)) {
        reject(new Error(`Cash build failed, see log: ${logPath}`));
        return;
      }

      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout waiting for log pattern ${pattern} in ${logPath}`));
        return;
      }

      setTimeout(attempt, 1000);
    }

    attempt();
  });
}

function applyEnvironment(plan, dryRun) {
  const actions = [];
  const envCode = plan.environment.h5EnvCode;

  if (plan.projects.includes('new_mobile_h5')) {
    actions.push(transformDomainConfig(config.mutations['new_mobile_h5.domainConfig'].path, envCode, dryRun));
    actions.push(transformLocalProjectConfig(config.mutations['new_mobile_h5.projectConfig'].path, envCode, dryRun));
  }

  if (plan.projects.includes('dhb-mobile-index')) {
    actions.push(transformDomainConfig(config.mutations['dhb-mobile-index.domainConfig'].path, envCode, dryRun));
    actions.push(transformLocalProjectConfig(config.mutations['dhb-mobile-index.projectConfig'].path, envCode, dryRun));
  }

  if (plan.projects.includes('customize-mini-program')) {
    actions.push(
      transformMiniHome(
        config.mutations['customize-mini-program.home'].path,
        plan.flags.useLocalMiniWebview,
        dryRun
      )
    );
    actions.push(
      transformProjectConfig(
        config.mutations['customize-mini-program.projectConfig'].path,
        plan.environment.miniBeforeCompile,
        dryRun
      )
    );
  }

  if (plan.flags.useSubpackages) {
    actions.push(
      transformPackageJson(
        config.mutations['dhbfront-cash-mini.packageJson'].path,
        plan.selectedSubpackages,
        dryRun
      )
    );
    actions.push(
      transformConfigIndex(
        config.mutations['dhbfront-cash-mini.configIndex'].path,
        plan.selectedSubpackages,
        dryRun
      )
    );
  }

  return actions;
}

async function startProjects(plan, dryRun) {
  const actions = [];
  const repos = config.repos;
  const cashCommand = resolveCashCommand(plan);

  if (plan.projects.includes('dhbfront-cash-mini')) {
    const cashAction = startManagedProcess('dhbfront-cash-mini', repos['dhbfront-cash-mini'].cwd, cashCommand, dryRun);
    actions.push(cashAction);
    if (!dryRun) {
      await waitForLogPattern(cashAction.logPath, /拷贝结束！/, 180000);
      actions.push({
        type: 'healthcheck',
        target: 'dhbfront-cash-mini',
        mode: 'log',
        pattern: '拷贝结束！',
      });
    }
  }

  plan.projects.forEach((projectKey) => {
    if (projectKey === 'customize-mini-program' || projectKey === 'dhb-packages' || projectKey === 'dhbfront-cash-mini') {
      return;
    }

    const repo = repos[projectKey];
    const command = repo.commands.default;

    actions.push(startManagedProcess(projectKey, repo.cwd, command, dryRun));
  });

  return actions;
}

async function verifyPlan(plan, dryRun) {
  if (dryRun) {
    return [];
  }

  const actions = [];

  if (plan.projects.includes('dhb-mobile-index')) {
    await waitForPort(3000, 60000);
    actions.push({ type: 'healthcheck', target: 'dhb-mobile-index', port: 3000 });
  }

  if (plan.projects.includes('new_mobile_h5')) {
    await waitForPort(9009, 60000);
    actions.push({ type: 'healthcheck', target: 'new_mobile_h5', port: 9009 });
  }

  return actions;
}

function printSummary(summary) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function buildManualCommands(plan) {
  const commands = [];

  if (plan.projects.includes('dhbfront-cash-mini')) {
    commands.push({
      project: 'dhbfront-cash-mini',
      cwd: config.repos['dhbfront-cash-mini'].cwd,
      waitFor: '首轮出现“编译结束！”和“拷贝结束！”',
      command: plan.cashMode.type === 'subpackage'
        ? 'npm run pack:h5:watch_with_subpackages'
        : 'npm run pack_dev:h5',
    });
  }

  if (plan.projects.includes('dhb-mobile-index')) {
    commands.push({
      project: 'dhb-mobile-index',
      cwd: config.repos['dhb-mobile-index'].cwd,
      waitFor: '3000 端口监听成功',
      note: '当前链路不要走一键启动；请单独开终端运行。若本机 Node 环境异常，优先确认 Volta 版本。',
      command: 'npm start',
    });
  }

  if (plan.projects.includes('new_mobile_h5')) {
    commands.push({
      project: 'new_mobile_h5',
      cwd: config.repos['new_mobile_h5'].cwd,
      waitFor: '9009 端口监听成功',
      note: '需在 dhb-mobile-index 之后启动，因为它会反代 3000。',
      command: 'npm start',
    });
  }

  if (plan.projects.includes('customize-mini-program')) {
    commands.push({
      project: 'customize-mini-program',
      cwd: config.repos['customize-mini-program'].cwd,
      waitFor: '按小程序本地开发流程编译',
      command: '请按项目既有小程序流程手动启动',
    });
  }

  return commands;
}

async function main() {
  ensureRuntimeLayout();

  const args = parseArgs(process.argv.slice(2));

  if (args.restore) {
    const actions = restoreAll(Boolean(args.dryRun));
    printSummary({
      mode: 'restore',
      dryRun: Boolean(args.dryRun),
      actions,
    });
    return;
  }

  if (!args.preset || !args.env) {
    throw new Error('Usage: run-projects.js --preset <preset-id> --env <test|release|online> [--subpackages a,b] [--dry-run]');
  }

  const selectedSubpackages = args.subpackages
    ? String(args.subpackages)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const plan = buildExecutionPlan({
    presetId: args.preset,
    environment: args.env,
    config,
    selectedSubpackages,
  });

  const dryRun = Boolean(args.dryRun);
  const summary = {
    mode: dryRun ? 'execute' : 'manual',
    dryRun,
    plan,
    actions: [],
  };

  if (!dryRun) {
    summary.message = '统一执行器启动已禁用，请按手动多终端模式分别运行各项目。';
    summary.commands = buildManualCommands(plan);
    printSummary(summary);
    return;
  }

  try {
    summary.actions = summary.actions.concat(stopManagedProcesses(dryRun));
    summary.actions = summary.actions.concat(snapshotBaseline(dryRun, plan.requiredMutationKeys));
    summary.actions = summary.actions.concat(applyEnvironment(plan, dryRun));
    summary.actions = summary.actions.concat(ensureSubpackageBuilds(selectedSubpackages, dryRun));

    summary.actions = summary.actions.concat(await startProjects(plan, dryRun));
    summary.actions = summary.actions.concat(await verifyPlan(plan, dryRun));

    printSummary(summary);
  } catch (error) {
    if (!dryRun) {
      const rollbackActions = [];
      rollbackActions.push(...stopManagedProcesses(false));
      rollbackActions.push(...restoreBaseline(false, plan.requiredMutationKeys));
      printSummary({
        mode: 'rollback',
        dryRun: false,
        reason: 'startup-failed',
        error: error && error.message ? error.message : String(error),
        plan,
        actions: rollbackActions,
      });
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
