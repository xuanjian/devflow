import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const AI_CONTEXT_ROOT = '/Users/xj/Documents/ai-context';
const GLOBAL_PROFILE = path.join(AI_CONTEXT_ROOT, 'person', 'profile.md');
const GLOBAL_WORK = path.join(AI_CONTEXT_ROOT, 'runtime', 'current-work.md');
const GLOBAL_PROFILE_COMPAT = '/Users/xj/AGENTS.md';
const GLOBAL_WORK_COMPAT = '/Users/xj/WORK_CONTEXT.md';
const GLOBAL_SHARED_SKILLS = ['ai-my-pm'];
const ROOTS = [
  '/Users/xj/Documents/frontend',
  '/Users/xj/Documents/ios',
  '/Users/xj/Documents/node',
  '/Users/xj/Documents/node/plugin',
  '/Users/xj/Documents/ComfyUI',
];

const LOCAL_GIT_IGNORE_PATTERNS = [
  'AGENTS.md',
  'CLAUDE.md',
  '.cursor/',
  '.trae/',
  '.codex/',
  '.ai-configs/',
  '.agents/',
];

const LOCAL_GIT_IGNORE_MARKER_BEGIN = '# >>> ai-context local ignores >>>';
const LOCAL_GIT_IGNORE_MARKER_END = '# <<< ai-context local ignores <<<';

const SKIP_BASENAMES = new Set([
  '_dhb-ai-context',
  'bff-goods-dist.__stale_backup',
  'local',
  '.venv',
  '.bizyair_cache',
]);

const OVERRIDES = {
  'DHB_PACKAGES': {
    repoKey: 'dhb-packages',
    family: 'frontend',
    repoType: 'domain-packages',
    summary: 'DHB 分包业务模块集合，常作为 cash-mini 上游联调仓库。',
    defaultScenes: ['single-repo-change', 'packages-cash-index-h5-webview', 'frontend-bff-debug'],
    tags: ['dhb', 'frontend', 'packages'],
    sharedRules: ['theme-config.mdc', 'i18n-chinese-key.mdc'],
    sharedSkills: [
      'run-projects',
      'restore-local-env',
      'dhb-env-switch',
      'dhb-packages/add-mobile-icon',
      'dhb-packages/add-taro-module.md',
      'dhb-packages/create-api-request.md',
      'dhb-packages/mock-api-from-curl.md',
    ],
  },
  'customize-mini-program': {
    family: 'frontend',
    repoType: 'mini-program-app',
    summary: '订货宝原生微信小程序，通过 WebView 承接 H5 链路。',
    defaultScenes: ['single-repo-change', 'mini-program-h5-webview', 'packages-cash-index-h5-webview'],
    tags: ['dhb', 'frontend', 'mini-program'],
    sharedRules: ['shared-context.mdc', 'customize-mini-program/customize-mini-program.mdc'],
    sharedSkills: ['run-projects', 'restore-local-env', 'dhb-env-switch'],
  },
  'dhb-International-mobile': {
    family: 'frontend',
    repoType: 'web-app',
    summary: 'DHB 国际化移动端项目，强调老项目 UI 100% 还原和组件化开发。',
    defaultScenes: ['single-repo-change'],
    tags: ['dhb', 'frontend', 'international'],
    sharedRules: ['dhb-international-mobile/dhb-international-mobile.mdc'],
  },
  'dhb-goods-image-tool': {
    family: 'frontend',
    repoType: 'tool',
    summary: '图片或商品素材处理相关工具仓库。',
    defaultScenes: ['single-repo-change'],
    tags: ['tool'],
  },
  'dhb-manager': {
    family: 'frontend',
    repoType: 'web-app',
    summary: 'DHB 管理端 PC React 项目。',
    defaultScenes: ['single-repo-change'],
    tags: ['dhb', 'frontend', 'manager'],
  },
  'dhb-mobile-index': {
    family: 'frontend',
    repoType: 'web-app',
    summary: '订货端 React H5 主入口，常处在容器链路和跨端联调中心。',
    defaultScenes: ['single-repo-change', 'index-h5-webview', 'cash-index-h5-webview', 'packages-cash-index-h5-webview', 'mini-program-h5-webview', 'frontend-bff-debug', 'ios-h5-webview-bff'],
    tags: ['dhb', 'frontend', 'h5'],
    sharedRules: ['dhb-mobile-index.mdc'],
    sharedSkills: ['run-projects', 'restore-local-env', 'dhb-env-switch'],
  },
  'dhbfront-cash-mini': {
    family: 'frontend',
    repoType: 'frontend-library',
    summary: 'Taro 跨平台组件库，作为 H5 与小程序的公共组件层。',
    defaultScenes: ['single-repo-change', 'cash-index-h5-webview', 'packages-cash-index-h5-webview', 'frontend-bff-debug'],
    tags: ['dhb', 'frontend', 'cash-mini'],
    sharedRules: ['dhbfront-cash-mini.mdc'],
    sharedSkills: [
      'run-projects',
      'restore-local-env',
      'dhb-env-switch',
      'dhbfront-cash-mini/add-subpackage-module',
      'dhbfront-cash-mini/update-subpackage-module',
    ],
  },
  'dhbfront-img': {
    family: 'frontend',
    repoType: 'asset-service',
    summary: '前端图片资源服务仓库。',
    defaultScenes: ['single-repo-change'],
    tags: ['dhb', 'frontend', 'assets'],
  },
  'dhbfront-manager-mobile': {
    family: 'frontend',
    repoType: 'web-app',
    summary: 'DHB 管理端移动 H5 项目。',
    defaultScenes: ['single-repo-change'],
    tags: ['dhb', 'frontend', 'manager'],
  },
  'dhbfront-utils': {
    family: 'frontend',
    repoType: 'shared-library',
    summary: 'DHB 前端公共工具库。',
    defaultScenes: ['single-repo-change'],
    tags: ['dhb', 'frontend', 'shared-library'],
  },
  'goods-initialization': {
    family: 'frontend',
    repoType: 'plugin',
    summary: '偏插件或初始化能力的前端工具仓库。',
    defaultScenes: ['single-repo-change'],
    tags: ['plugin', 'tool'],
  },
  'hxb-mobile': {
    family: 'frontend',
    repoType: 'web-app',
    summary: '货销宝移动端项目。',
    defaultScenes: ['single-repo-change'],
    tags: ['hxb', 'frontend'],
  },
  'im-H5': {
    family: 'frontend',
    repoType: 'web-app',
    summary: 'IM 相关 H5 项目。',
    defaultScenes: ['single-repo-change'],
    tags: ['frontend'],
  },
  'new_mobile_h5': {
    family: 'frontend',
    repoType: 'legacy-container',
    summary: '订货端老 H5 容器，承接 iframe 与 WebView 容器链路。',
    defaultScenes: ['single-repo-change', 'index-h5-webview', 'cash-index-h5-webview', 'packages-cash-index-h5-webview', 'mini-program-h5-webview', 'ios-h5-webview-bff'],
    tags: ['dhb', 'frontend', 'container'],
    sharedRules: ['shared-context.mdc', 'new-mobile-h5/new-mobile-h5.mdc'],
    sharedSkills: ['run-projects', 'restore-local-env', 'dhb-env-switch'],
  },
  'yxt-mobile': {
    family: 'frontend',
    repoType: 'web-app',
    summary: '其它移动端前端项目。',
    defaultScenes: ['single-repo-change'],
    tags: ['frontend'],
  },
  'BrandApp': {
    family: 'ios',
    repoType: 'ios-app',
    summary: 'iOS 原生应用仓库。',
    defaultScenes: ['single-repo-change', 'ios-h5-webview-bff'],
    tags: ['ios'],
  },
  'DHB': {
    family: 'ios',
    repoType: 'ios-app',
    summary: '订货宝 iOS 原生 App，常与 H5、WebView、BFF 联动。',
    defaultScenes: ['single-repo-change', 'index-h5-webview', 'cash-index-h5-webview', 'packages-cash-index-h5-webview', 'ios-h5-webview-bff'],
    tags: ['dhb', 'ios'],
    sharedRules: [
      'ios-dhb/001-project-overview.mdc',
      'ios-dhb/002-naming-conventions.mdc',
      'ios-dhb/003-file-structure.mdc',
      'ios-dhb/010-page-creation.mdc',
      'ios-dhb/011-layout-sdautolayout.mdc',
      'ios-dhb/012-networking.mdc',
      'ios-dhb/013-data-model.mdc',
      'ios-dhb/020-notification-system.mdc',
      'ios-dhb/021-cart-shopping.mdc',
      'ios-dhb/030-memory-management.mdc',
      'ios-dhb/031-thread-safety.mdc',
      'ios-dhb/032-error-handling.mdc',
      'ios-dhb/040-project-specific.mdc',
      'ios-dhb/041-forbidden-practices.mdc',
      'ios-dhb/050-testing.mdc',
      'ios-dhb/051-deployment.mdc',
      'ios-dhb/052-common-issues.mdc',
      'ios-dhb/053-code-review.mdc',
      'ios-dhb/NETWORKING_UPDATE_V2.1.md',
      'ios-dhb/README.md',
    ],
  },
  'HXB': {
    family: 'ios',
    repoType: 'ios-app',
    summary: '货销宝 iOS 原生 App。',
    defaultScenes: ['single-repo-change', 'ios-h5-webview-bff'],
    tags: ['hxb', 'ios'],
  },
  'Open-AutoGLM': {
    family: 'ios',
    repoType: 'experiment',
    summary: '实验性质的 iOS / AI 项目。',
    defaultScenes: ['single-repo-change'],
    tags: ['ios', 'experiment'],
  },
  'apple-app-site-association': {
    family: 'ios',
    repoType: 'config',
    summary: 'Apple app site association 配置仓库。',
    defaultScenes: ['single-repo-change'],
    tags: ['ios', 'config'],
  },
  'bff-goods': {
    family: 'node',
    repoType: 'bff-service',
    summary: '商品 BFF，同时承接 AI 海报、ComfyUI 相关能力。',
    defaultScenes: ['single-repo-change', 'frontend-bff-debug', 'ios-h5-webview-bff'],
    tags: ['dhb', 'node', 'bff', 'goods'],
  },
  'bff-hub': {
    family: 'node',
    repoType: 'bff-service',
    summary: 'Hub 类 Node 服务仓库。',
    defaultScenes: ['single-repo-change', 'frontend-bff-debug'],
    tags: ['node', 'bff'],
  },
  'bff-order': {
    family: 'node',
    repoType: 'bff-service',
    summary: '订单 BFF 服务。',
    defaultScenes: ['single-repo-change', 'frontend-bff-debug', 'ios-h5-webview-bff'],
    tags: ['dhb', 'node', 'bff', 'order'],
  },
  'bff-payment': {
    family: 'node',
    repoType: 'bff-service',
    summary: '支付 BFF 服务。',
    defaultScenes: ['single-repo-change', 'frontend-bff-debug', 'ios-h5-webview-bff'],
    tags: ['dhb', 'node', 'bff', 'payment'],
  },
  'bff-user': {
    family: 'node',
    repoType: 'bff-service',
    summary: '用户 BFF 服务。',
    defaultScenes: ['single-repo-change', 'frontend-bff-debug', 'ios-h5-webview-bff'],
    tags: ['dhb', 'node', 'bff', 'user'],
  },
  'bff-warehouse': {
    family: 'node',
    repoType: 'bff-service',
    summary: '仓储 BFF 服务。',
    defaultScenes: ['single-repo-change', 'frontend-bff-debug', 'ios-h5-webview-bff'],
    tags: ['dhb', 'node', 'bff', 'warehouse'],
  },
  'docs': {
    family: 'node',
    repoType: 'docs',
    summary: '文档仓库。',
    defaultScenes: ['single-repo-change'],
    tags: ['docs'],
  },
  'egg-business': {
    family: 'node',
    repoType: 'shared-library',
    summary: 'Egg 公共业务模块仓库。',
    defaultScenes: ['single-repo-change', 'frontend-bff-debug', 'ios-h5-webview-bff'],
    tags: ['dhb', 'node', 'shared-library'],
  },
  'egg-dhb-framework': {
    family: 'node',
    repoType: 'plugin',
    summary: 'DHB BFF 基础框架插件仓库，提供 Controller/Service 基类、权限中间件和请求封装。',
    defaultScenes: ['single-repo-change', 'frontend-bff-debug', 'ios-h5-webview-bff'],
    tags: ['dhb', 'node', 'plugin', 'framework'],
  },
  'egg-dhb-permission': {
    family: 'node',
    repoType: 'plugin',
    summary: 'DHB 接口权限控制插件仓库。',
    defaultScenes: ['single-repo-change', 'frontend-bff-debug', 'ios-h5-webview-bff'],
    tags: ['dhb', 'node', 'plugin', 'permission'],
  },
  'print': {
    family: 'node',
    repoType: 'tool',
    summary: '打印或输出相关工具仓库。',
    defaultScenes: ['single-repo-change'],
    tags: ['node', 'tool'],
  },
  'ComfyUI': {
    repoKey: 'comfyui-root',
    family: 'comfyui',
    repoType: 'workspace-root',
    summary: 'ComfyUI 工作目录根节点，用于工作流、custom_nodes 和模型管理。',
    defaultScenes: ['single-repo-change'],
    tags: ['comfyui', 'ai'],
  },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function looksLikeProjectDir(repoPath) {
  if (fs.existsSync(path.join(repoPath, '.git'))) return true;
  if (fs.existsSync(path.join(repoPath, 'package.json'))) return true;
  if (fs.existsSync(path.join(repoPath, 'Podfile'))) return true;
  if (fs.existsSync(path.join(repoPath, 'project.pbxproj'))) return true;
  const aiMarkers = ['.cursor', '.codex', '.agents', '.ai-configs', '.claude'];
  if (aiMarkers.some(name => fs.existsSync(path.join(repoPath, name)))) return true;
  const children = fs.readdirSync(repoPath);
  return children.some(name => name.endsWith('.xcodeproj') || name.endsWith('.xcworkspace'));
}

function scanRepos() {
  const repos = [];

  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;

    if (path.basename(root) === 'ComfyUI') {
      repos.push(root);
      continue;
    }

    for (const name of fs.readdirSync(root)) {
      if (SKIP_BASENAMES.has(name)) continue;
      const repoPath = path.join(root, name);
      if (!fs.existsSync(repoPath) || !fs.statSync(repoPath).isDirectory()) continue;
      if (looksLikeProjectDir(repoPath)) {
        repos.push(repoPath);
      }
    }
  }

  return repos.sort();
}

function makeRepoEntry(repoPath) {
  const base = path.basename(repoPath);
  const override = OVERRIDES[base] || {};
  const rootName = repoPath.includes('/frontend/') ? 'frontend'
    : repoPath.includes('/ios/') ? 'ios'
    : repoPath.includes('/node/') ? 'node'
    : repoPath.includes('/ComfyUI') ? 'comfyui'
    : 'misc';
  const repoKey = override.repoKey || slugify(base);
  const repoDocPath = path.join(AI_CONTEXT_ROOT, 'repos', `${repoKey}.md`);
  const sharedSkills = Array.from(new Set([
    ...GLOBAL_SHARED_SKILLS,
    ...(override.sharedSkills || []),
  ]));

  return {
    repoKey,
    displayName: base,
    path: repoPath,
    family: override.family || rootName,
    repoType: override.repoType || 'app',
    summary: override.summary || `${base} 项目。`,
    defaultScenes: override.defaultScenes || ['single-repo-change'],
    tags: override.tags || [rootName],
    sharedRules: override.sharedRules || [],
    sharedSkills,
    repoDocPath,
  };
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceWithSymlink(targetPath, sourcePath) {
  ensureDir(path.dirname(targetPath));
  try {
    fs.rmSync(targetPath, { force: true, recursive: true });
  } catch {}
  fs.symlinkSync(sourcePath, targetPath);
}

function bundleTargetName(bundlePath) {
  return path.basename(bundlePath);
}

function formatToolFlags(tools) {
  if (!tools || Object.keys(tools).length === 0) return '- 未配置';
  return Object.entries(tools)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `- ${name}: \`${value}\``)
    .join('\n');
}

function resolveRepoTools(entry, repoToolsPayload) {
  const defaults = repoToolsPayload?.defaultsByFamily?.[entry.family] || {};
  const overrides = repoToolsPayload?.repos?.[entry.repoKey] || {};
  return { ...defaults, ...overrides };
}

function renderClientSummary(clientsPayload) {
  const clients = clientsPayload?.clients || {};
  const rows = Object.entries(clients)
    .map(([key, client]) => {
      const entries = (client.entryFiles || []).map(item => `\`${item}\``).join(', ') || '-';
      return `| \`${key}\` | ${client.displayName || key} | ${client.role || '-'} | ${entries} |`;
    })
    .join('\n');
  if (!rows) return '未配置。';
  return `| Client | Display Name | Role | Entry Files |
| --- | --- | --- | --- |
${rows}`;
}

function runGit(repoPath, args) {
  try {
    return execFileSync('git', ['-C', repoPath, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function syncLocalGitIgnore(repoPath) {
  const insideWorkTree = runGit(repoPath, ['rev-parse', '--is-inside-work-tree']);
  if (insideWorkTree !== 'true') return;

  const excludePathRaw = runGit(repoPath, ['rev-parse', '--git-path', 'info/exclude']);
  if (!excludePathRaw) return;
  const excludePath = path.isAbsolute(excludePathRaw)
    ? excludePathRaw
    : path.join(repoPath, excludePathRaw);

  ensureDir(path.dirname(excludePath));
  const existing = fs.existsSync(excludePath) ? fs.readFileSync(excludePath, 'utf8') : '';
  const block = `${LOCAL_GIT_IGNORE_MARKER_BEGIN}\n${LOCAL_GIT_IGNORE_PATTERNS.join('\n')}\n${LOCAL_GIT_IGNORE_MARKER_END}`;
  const markerRegex = new RegExp(
    `${escapeRegExp(LOCAL_GIT_IGNORE_MARKER_BEGIN)}[\\s\\S]*?${escapeRegExp(LOCAL_GIT_IGNORE_MARKER_END)}`,
    'm',
  );

  let next = existing;
  if (markerRegex.test(existing)) {
    next = existing.replace(markerRegex, block);
  } else {
    next = existing.replace(/\s*$/, '');
    next = `${next}${next ? '\n\n' : ''}${block}\n`;
  }
  fs.writeFileSync(excludePath, next);

  const tracked = runGit(repoPath, ['ls-files', '--', ...LOCAL_GIT_IGNORE_PATTERNS]);
  if (!tracked) return;
  const trackedFiles = tracked.split('\n').map(line => line.trim()).filter(Boolean);
  if (!trackedFiles.length) return;

  try {
    execFileSync('git', ['-C', repoPath, 'update-index', '--skip-worktree', '--', ...trackedFiles], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
  } catch {}
}

function renderRepoDoc(entry, repoTools) {
  const scenes = entry.defaultScenes.map(scene => `- \`${scene}\``).join('\n');
  const tags = entry.tags.map(tag => `- \`${tag}\``).join('\n');
  const tools = formatToolFlags(repoTools);

  return `# ${entry.displayName}

- repoKey: \`${entry.repoKey}\`
- 路径: \`${entry.path}\`
- family: \`${entry.family}\`
- repoType: \`${entry.repoType}\`

## 摘要

${entry.summary}

## 默认加载场景

${scenes}

## 标签

${tags}

## 可用工具

${tools}

## 读取建议

- 先读取全局长期画像：\`${GLOBAL_PROFILE}\`
- 再读取当前工作上下文：\`${GLOBAL_WORK}\`
- \`${GLOBAL_PROFILE_COMPAT}\` 和 \`${GLOBAL_WORK_COMPAT}\` 仅作为兼容入口
- 若用户只讨论当前仓库，优先使用 \`single-repo-change\`
- 若用户提到跨仓联调、容器、BFF、iOS 或小程序，再补充 scene
`;
}

function renderAgents(entry, repoTools, clientsPayload) {
  const tools = formatToolFlags(repoTools);
  const clients = renderClientSummary(clientsPayload);

  return `# ${entry.displayName} AI 入口

> 这份文件由 \`/Users/xj/Documents/ai-context/scripts/generate-adapters.mjs\` 生成。项目级正文请维护在中心上下文仓库，不要在这里堆长文。

## 当前仓库

- repoKey: \`${entry.repoKey}\`
- path: \`${entry.path}\`
- repoType: \`${entry.repoType}\`

## 会话读取顺序

请优先阅读：

1. \`${GLOBAL_PROFILE}\`
2. \`${GLOBAL_WORK}\`
3. \`${entry.repoDocPath}\`
4. \`/Users/xj/Documents/ai-context/registry/scenes.json\`
5. \`/Users/xj/Documents/ai-context/registry/clients.json\`
6. \`/Users/xj/Documents/ai-context/registry/repo-tools.json\`
7. \`/Users/xj/Documents/ai-context/registry/notion-sources.json\`

兼容入口：

- \`${GLOBAL_PROFILE_COMPAT}\`
- \`${GLOBAL_WORK_COMPAT}\`

## 场景装配规则

- 默认先使用 \`single-repo-change\`
- 如果用户明确提到跨项目链路，再按需补充以下默认 scene：
${entry.defaultScenes.map(scene => `  - \`${scene}\``).join('\n')}
- 如果用户只描述开发需求，或明确提到 \`ai-my-pm\`、AI PM、\`ai-dev-team\`、多 Agent、角色分工或跨仓大任务，读取 \`/Users/xj/Documents/ai-context/scenes/ai-my-pm.md\`
- DHB/HXB 项目路由不清楚时，按 \`registry/notion-sources.json\` 读取 Notion \`DHB 项目地图\`
- 插件、工具、实验项目不要默认扩展到 DHB 业务链路，除非用户明确提到相关仓库

## 当前仓库可用工具

${tools}

## AI Client 能力

${clients}

## 当前目标

- 让任意工具在项目根目录打开会话时，都能先命中统一入口
- 再通过中心上下文仓库恢复长期画像、当前工作与项目/链路上下文
`;
}

function renderClaude(entry, repoTools, clientsPayload) {
  const tools = formatToolFlags(repoTools);
  const clients = renderClientSummary(clientsPayload);

  return `# ${entry.displayName} Claude Code 入口

请优先阅读以下文件：

1. \`${GLOBAL_PROFILE}\`
2. \`${GLOBAL_WORK}\`
3. \`${entry.repoDocPath}\`
4. \`/Users/xj/Documents/ai-context/registry/scenes.json\`
5. \`/Users/xj/Documents/ai-context/registry/clients.json\`
6. \`/Users/xj/Documents/ai-context/registry/repo-tools.json\`
7. \`/Users/xj/Documents/ai-context/registry/notion-sources.json\`

\`${GLOBAL_PROFILE_COMPAT}\` 和 \`${GLOBAL_WORK_COMPAT}\` 仅作为兼容入口；权威正文以上方 ai-context 文件为准。

默认先按 \`single-repo-change\` 理解当前任务；如果用户明确提到跨仓联调、BFF、WebView、小程序或 iOS，再补充对应 scene。

## 当前仓库可用工具

${tools}

## AI Client 能力

${clients}
`;
}

function renderCursorRule(entry, repoTools) {
  const tools = formatToolFlags(repoTools);

  return `---
alwaysApply: true
---
# ${entry.displayName} ai-context 入口

当前仓库：
- repoKey: \`${entry.repoKey}\`
- repoType: \`${entry.repoType}\`

请优先阅读：
1. \`${GLOBAL_PROFILE}\`
2. \`${GLOBAL_WORK}\`
3. \`${entry.repoDocPath}\`
4. \`/Users/xj/Documents/ai-context/registry/scenes.json\`
5. \`/Users/xj/Documents/ai-context/registry/clients.json\`
6. \`/Users/xj/Documents/ai-context/registry/repo-tools.json\`
7. \`/Users/xj/Documents/ai-context/registry/notion-sources.json\`

\`${GLOBAL_PROFILE_COMPAT}\` 和 \`${GLOBAL_WORK_COMPAT}\` 仅作为兼容入口；权威正文以上方 ai-context 文件为准。

默认使用 \`single-repo-change\`。如果用户明确提到跨项目链路，再按需补充以下 scene：
${entry.defaultScenes.map(scene => `- \`${scene}\``).join('\n')}

当前仓库可用工具：
${tools}
`;
}

function bundleSourcePath(kind, ref) {
  return path.join(AI_CONTEXT_ROOT, 'bundles', kind === 'rule' ? 'rules' : 'skills', ref);
}

function normalizeBundleKey(kind, ref) {
  return `${kind}:${ref}`.replace(/\.(mdc|md)$/i, '').replace(/[\\/]+/g, '/');
}

function bundleProbeFiles(sourcePath) {
  if (!fs.existsSync(sourcePath)) return [];
  const stat = fs.statSync(sourcePath);
  if (stat.isFile()) return [sourcePath];
  return [
    path.join(sourcePath, 'SKILL.md'),
    path.join(sourcePath, 'README.md'),
  ].filter(candidate => fs.existsSync(candidate));
}

function extractMetadataText(text) {
  if (!text) return { title: null, summary: null };
  const lines = text.split('\n');
  let title = null;
  let summary = null;
  let bodyStart = 0;

  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === '---') {
        bodyStart = i + 1;
        break;
      }
      const descMatch = line.match(/^description:\s*(.+)$/);
      const nameMatch = line.match(/^name:\s*(.+)$/);
      if (!summary && descMatch) summary = descMatch[1].trim().replace(/^["']|["']$/g, '');
      if (!title && nameMatch) title = nameMatch[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  for (const rawLine of lines.slice(bodyStart)) {
    const line = rawLine.trim();
    if (!title && line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').trim();
      continue;
    }
    if (!summary && line && !line.startsWith('---') && !line.startsWith('#')) {
      summary = line.replace(/^>\s*/, '').trim();
      if (summary) break;
    }
  }

  return { title, summary };
}

function buildBundleRegistry(repos) {
  const bundleMap = new Map();

  for (const repo of repos) {
    for (const ref of repo.sharedRules) {
      const key = normalizeBundleKey('rule', ref);
      if (!bundleMap.has(key)) {
        bundleMap.set(key, {
          bundleKey: key,
          kind: 'rule',
          ref,
          path: bundleSourcePath('rule', ref),
          repoKeys: new Set(),
          families: new Set(),
          tags: new Set(),
          defaultScenes: new Set(),
        });
      }
      const item = bundleMap.get(key);
      item.repoKeys.add(repo.repoKey);
      item.families.add(repo.family);
      repo.tags.forEach(tag => item.tags.add(tag));
      repo.defaultScenes.forEach(scene => item.defaultScenes.add(scene));
    }

    for (const ref of repo.sharedSkills) {
      const key = normalizeBundleKey('skill', ref);
      if (!bundleMap.has(key)) {
        bundleMap.set(key, {
          bundleKey: key,
          kind: 'skill',
          ref,
          path: bundleSourcePath('skill', ref),
          repoKeys: new Set(),
          families: new Set(),
          tags: new Set(),
          defaultScenes: new Set(),
        });
      }
      const item = bundleMap.get(key);
      item.repoKeys.add(repo.repoKey);
      item.families.add(repo.family);
      repo.tags.forEach(tag => item.tags.add(tag));
      repo.defaultScenes.forEach(scene => item.defaultScenes.add(scene));
    }
  }

  return Array.from(bundleMap.values()).map(item => {
    const exists = fs.existsSync(item.path);
    const sourceType = exists ? (fs.statSync(item.path).isDirectory() ? 'directory' : 'file') : 'missing';
    const probeFiles = bundleProbeFiles(item.path);
    let title = null;
    let summary = null;
    for (const file of probeFiles) {
      const meta = extractMetadataText(readTextIfExists(file));
      title = title || meta.title;
      summary = summary || meta.summary;
    }

    const repoKeys = Array.from(item.repoKeys).sort();
    const families = Array.from(item.families).sort();
    const tags = Array.from(item.tags).sort();
    const defaultScenes = Array.from(item.defaultScenes).sort();

    let scope = 'project';
    if (repoKeys.length === 0) scope = 'unbound';
    else if (repoKeys.length === 1) scope = 'project';
    else if (families.length > 1) scope = 'cross-family';
    else scope = 'shared';

    return {
      bundleKey: item.bundleKey,
      kind: item.kind,
      ref: item.ref,
      title: title || path.basename(item.ref),
      summary: summary || `${item.kind === 'rule' ? '规则' : '技能'} bundle：${item.ref}`,
      path: item.path,
      sourceType,
      scope,
      repoKeys,
      families,
      tags,
      defaultScenes,
    };
  }).sort((a, b) => a.bundleKey.localeCompare(b.bundleKey));
}

function renderOverviewDoc(repos, scenes, bundles) {
  const reposByKey = new Map(repos.map(repo => [repo.repoKey, repo]));
  const bundlesByRepo = new Map();
  for (const repo of repos) bundlesByRepo.set(repo.repoKey, []);
  for (const bundle of bundles) {
    for (const repoKey of bundle.repoKeys) {
      if (!bundlesByRepo.has(repoKey)) bundlesByRepo.set(repoKey, []);
      bundlesByRepo.get(repoKey).push(bundle);
    }
  }

  const nonSingleScenes = scenes.filter(scene => scene.sceneKey !== 'single-repo-change');
  const sceneSections = scenes.map(scene => {
    const sceneRepos = repos
      .filter(repo => repo.defaultScenes.includes(scene.sceneKey))
      .sort((a, b) => a.repoKey.localeCompare(b.repoKey));
    const sceneRepoList = sceneRepos.map(repo => `\`${repo.repoKey}\``).join('、') || '无';
    return `| \`${scene.sceneKey}\` | ${scene.summary} | ${sceneRepos.length} | ${sceneRepoList} |`;
  }).join('\n');

  const familyOrder = ['frontend', 'ios', 'node', 'comfyui', 'misc'];
  const repoSections = familyOrder
    .filter(family => repos.some(repo => repo.family === family))
    .map(family => {
      const familyRepos = repos
        .filter(repo => repo.family === family)
        .sort((a, b) => a.repoKey.localeCompare(b.repoKey));
      const rows = familyRepos.map(repo => {
        const attached = bundlesByRepo.get(repo.repoKey) || [];
        const rules = attached.filter(bundle => bundle.kind === 'rule').length;
        const skills = attached.filter(bundle => bundle.kind === 'skill').length;
        return `| \`${repo.repoKey}\` | ${repo.repoType} | ${repo.defaultScenes.map(scene => `\`${scene}\``).join('<br>')} | ${rules} | ${skills} |`;
      }).join('\n');
      return `### ${family}\n\n| Repo | Type | Default Scenes | Rules | Skills |\n| --- | --- | --- | ---: | ---: |\n${rows}`;
    }).join('\n\n');

  const scopeCounts = bundles.reduce((acc, bundle) => {
    const key = `${bundle.kind}:${bundle.scope}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const scopeRows = Object.keys(scopeCounts)
    .sort()
    .map(key => {
      const [kind, scope] = key.split(':');
      return `| ${kind} | ${scope} | ${scopeCounts[key]} |`;
    }).join('\n');

  const graphLines = ['flowchart LR'];
  const declaredNodes = new Set();
  for (const scene of nonSingleScenes) {
    const sceneId = `scene_${scene.sceneKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
    if (!declaredNodes.has(sceneId)) {
      graphLines.push(`  ${sceneId}["${scene.sceneKey}"]`);
      declaredNodes.add(sceneId);
    }
    const sceneRepos = repos
      .filter(repo => repo.defaultScenes.includes(scene.sceneKey))
      .sort((a, b) => a.repoKey.localeCompare(b.repoKey));
    for (const repo of sceneRepos) {
      const repoId = `repo_${repo.repoKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
      if (!declaredNodes.has(repoId)) {
        graphLines.push(`  ${repoId}["${repo.repoKey}"]`);
        declaredNodes.add(repoId);
      }
      graphLines.push(`  ${sceneId} --> ${repoId}`);
    }
  }

  return `# Scene Repo Bundle Overview

> 自动生成于 \`${new Date().toISOString()}\`。用于快速查看 \`scene -> repo -> bundle\` 的默认装配关系。

## 总览

- repos: \`${repos.length}\`
- scenes: \`${scenes.length}\`
- bundles: \`${bundles.length}\`

## Scene Graph

\`\`\`mermaid
${graphLines.join('\n')}
\`\`\`

## Scene -> Repo

| Scene | Summary | Repo Count | Repos |
| --- | --- | ---: | --- |
${sceneSections}

## Repo -> Bundle

${repoSections}

## Bundle Scope

| Kind | Scope | Count |
| --- | --- | ---: |
${scopeRows}
`;
}

function generate() {
  const repos = scanRepos().map(makeRepoEntry);
  const scenesPayload = JSON.parse(fs.readFileSync(path.join(AI_CONTEXT_ROOT, 'registry', 'scenes.json'), 'utf8'));
  const clientsPayload = readJsonIfExists(path.join(AI_CONTEXT_ROOT, 'registry', 'clients.json'), { version: 1, clients: {} });
  const repoToolsPayload = readJsonIfExists(path.join(AI_CONTEXT_ROOT, 'registry', 'repo-tools.json'), { version: 1, defaultsByFamily: {}, repos: {} });
  writeJson(path.join(AI_CONTEXT_ROOT, 'registry', 'repos.json'), {
    version: 2,
    generatedAt: new Date().toISOString(),
    repos,
  });
  const bundles = buildBundleRegistry(repos);
  writeJson(path.join(AI_CONTEXT_ROOT, 'registry', 'bundles.json'), {
    version: 1,
    generatedAt: new Date().toISOString(),
    bundles,
  });
  writeFile(
    path.join(AI_CONTEXT_ROOT, 'docs', 'scene-repo-bundle-overview.md'),
    renderOverviewDoc(repos, scenesPayload.scenes, bundles),
  );

  for (const entry of repos) {
    const repoTools = resolveRepoTools(entry, repoToolsPayload);

    writeFile(entry.repoDocPath, renderRepoDoc(entry, repoTools));
    writeFile(path.join(entry.path, 'AGENTS.md'), renderAgents(entry, repoTools, clientsPayload));
    writeFile(path.join(entry.path, 'CLAUDE.md'), renderClaude(entry, repoTools, clientsPayload));
    writeFile(path.join(entry.path, '.cursor', 'rules', '00-ai-context.mdc'), renderCursorRule(entry, repoTools));
    writeFile(path.join(entry.path, '.codex', 'AGENTS.md'), renderAgents(entry, repoTools, clientsPayload));

    if (fs.existsSync(path.join(entry.path, '.ai-configs')) || fs.existsSync(path.join(entry.path, '.claude'))) {
      writeFile(path.join(entry.path, '.ai-configs', 'claude.md'), renderClaude(entry, repoTools, clientsPayload));
      writeFile(path.join(entry.path, '.ai-configs', 'rules', '00-ai-context.mdc'), renderCursorRule(entry, repoTools));
    }

    for (const ruleName of entry.sharedRules) {
      const source = path.join(AI_CONTEXT_ROOT, 'bundles', 'rules', ruleName);
      const targetName = bundleTargetName(ruleName);
      replaceWithSymlink(path.join(entry.path, '.cursor', 'rules', targetName), source);
      if (fs.existsSync(path.join(entry.path, '.ai-configs')) || fs.existsSync(path.join(entry.path, '.claude'))) {
        replaceWithSymlink(path.join(entry.path, '.ai-configs', 'rules', targetName), source);
      }
    }

    for (const skillName of entry.sharedSkills) {
      const source = path.join(AI_CONTEXT_ROOT, 'bundles', 'skills', skillName);
      const targetName = bundleTargetName(skillName);
      replaceWithSymlink(path.join(entry.path, '.cursor', 'skills', targetName), source);
      replaceWithSymlink(path.join(entry.path, '.agents', 'skills', targetName), source);
      replaceWithSymlink(path.join(entry.path, '.codex', 'skills', targetName), source);
      if (fs.existsSync(path.join(entry.path, '.ai-configs')) || fs.existsSync(path.join(entry.path, '.claude'))) {
        replaceWithSymlink(path.join(entry.path, '.ai-configs', 'skills', targetName), source);
      }
    }

    syncLocalGitIgnore(entry.path);
  }

  console.log(`Generated ai-context adapters for ${repos.length} repositories.`);
}

generate();
