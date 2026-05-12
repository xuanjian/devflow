import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { readJsonFile } from "./json-loader.mjs";
import { resolveInside, toPath } from "./paths.mjs";

const COMMAND_TIMEOUT_MS = 60000;

const ACTIONS = {
  install_frontend_dependencies: {
    run: ({ rootPath }) => runFixedCommand(rootPath, ["npm", "install"])
  },
  install_ai_context: {
    run: ({ rootPath }) => runFixedCommand(rootPath, ["node", "scripts/install-ai-context.mjs", "install"])
  },
  validate_ai_context: {
    run: ({ rootPath }) => runFixedCommand(rootPath, ["node", "scripts/install-ai-context.mjs", "validate"])
  },
  check_ai_context: {
    run: ({ rootPath }) => runFixedCommand(rootPath, ["node", "scripts/install-ai-context.mjs", "check"])
  },
  sync_project_entry: {
    run: syncProjectEntry
  },
  add_project_from_path: {
    run: addProjectFromPath
  },
  add_scene: {
    run: addScene
  },
  add_skill_from_path: {
    run: addSkillFromPath
  },
  add_rule: {
    run: addRule
  },
  create_minimal_profile_json: {
    run: ({ rootPath, actionId }) => createFileOnce(rootPath, actionId, "config/profile.json", JSON.stringify({
      version: 1,
      sourcePath: "docs/person/profile.md",
      role: "TODO: fill in stable role and collaboration profile",
      collaborationPreferences: []
    }, null, 2) + "\n")
  },
  create_minimal_person_profile: {
    run: ({ rootPath, actionId }) => createFileOnce(rootPath, actionId, "docs/person/profile.md", "# Profile\n\nTODO: fill in real long-term preferences and collaboration context.\n")
  }
};

export async function runAction({ rootDir = process.cwd(), actionId, body = {} } = {}) {
  const rootPath = toPath(rootDir);
  const action = ACTIONS[actionId];
  if (!action) {
    return actionError(actionId, "unsupported_action", `Unsupported action: ${actionId}`);
  }

  try {
    return await action.run({ rootPath, actionId, body });
  } catch (error) {
    return actionError(actionId, "action_failed", error?.message || String(error));
  }
}

async function syncProjectEntry({ rootPath, actionId, body }) {
  const projectId = body?.projectId;
  if (!projectId || typeof projectId !== "string" || projectId.includes("/") || projectId.includes("..")) {
    return actionError(actionId, "invalid_project_id", "sync_project_entry requires a safe projectId.");
  }

  const index = await readJsonFile(resolveInside(rootPath, "config/projects/index.json"));
  const exists = index.data?.projects?.some((project) => project.id === projectId);
  if (!exists) {
    return actionError(actionId, "invalid_project_id", `Unknown projectId: ${projectId}`);
  }

  return runFixedCommand(rootPath, ["node", "scripts/install-ai-context.mjs", "sync-projects", "--project", projectId, "--write"], actionId);
}

async function addProjectFromPath({ rootPath, actionId, body }) {
  const projectPath = body?.projectPath ? path.resolve(String(body.projectPath)) : "";
  if (!projectPath) {
    return actionError(actionId, "invalid_project_path", "新增项目需要填写项目路径。");
  }
  const stat = await safeStat(projectPath);
  if (!stat?.isDirectory()) {
    return actionError(actionId, "invalid_project_path", `项目路径不存在或不是目录: ${projectPath}`);
  }

  const packageJson = await readOptionalJson(path.join(projectPath, "package.json"));
  const folderName = path.basename(projectPath);
  const id = normalizeId(body?.projectId || folderName);
  if (!id) {
    return actionError(actionId, "invalid_project_id", "新增项目需要可用的项目 ID。");
  }
  const name = String(body?.name || packageJson?.name || folderName);
  const technologyFamilyId = String(body?.technologyFamilyId || inferTechnologyFamily(projectPath, packageJson));
  const repoType = String(body?.repoType || inferRepoType(technologyFamilyId, packageJson));
  const sourceDocs = await scanProjectIntroDocs(projectPath);
  const summary = String(body?.summary || summarizeProject(name, sourceDocs));
  const changedPaths = [];
  const projectRuleNote = await ensureProjectEntryNote(projectPath, rootPath);
  if (projectRuleNote) changedPaths.push(projectRuleNote);

  const projectIndex = await readRootJson(rootPath, "config/projects/index.json", { version: 1, projects: [] });
  const skillCatalog = await readRootJson(rootPath, "config/skills/skills.json", { version: 1, skills: [] });
  const ruleCatalog = await readRootJson(rootPath, "config/rules/rules.json", { version: 1, rules: [] });

  const importedSkills = [];
  for (const skillDir of await scanSkillDirs(projectPath)) {
    const imported = await importSkillDirectory(rootPath, skillDir, {
      id: `${id}-${normalizeId(path.basename(skillDir))}`,
      projectIds: [id],
      catalog: skillCatalog
    });
    importedSkills.push(imported.skill);
    changedPaths.push(...imported.changedPaths);
  }

  const importedRules = [];
  for (const ruleFile of await scanRuleFiles(projectPath)) {
    const ruleBase = normalizeRuleFileId(path.basename(ruleFile, path.extname(ruleFile)));
    const imported = await importRuleFile(rootPath, ruleFile, {
      id: `${id}/${ruleBase}`,
      name: titleFromId(ruleBase),
      purpose: `Rules discovered from ${name}.`,
      projectIds: [id],
      sceneIds: [],
      applyMode: "project-on-demand",
      catalog: ruleCatalog
    });
    importedRules.push(imported.rule);
    changedPaths.push(...imported.changedPaths);
  }

  const project = {
    version: 1,
    id,
    name,
    technologyFamilyId,
    repoType,
    summary,
    path: projectPath,
    tags: uniqueSorted([technologyFamilyId, ...listFromBody(body?.tags)]),
    doc: {
      path: `docs/repos/${id}.md`,
      title: name,
      summary,
      whenToRead: "Read after this project is selected and the JSON summary is insufficient."
    },
    scenes: [],
    skills: importedSkills.map(makeSkillMount),
    rules: importedRules.map(makeRuleMount),
    readPolicy: {
      defaultRead: [`config/projects/${id}.json`],
      onDemandRead: [
        `docs/repos/${id}.md`,
        ...importedSkills.map((skill) => skill.sourcePath),
        ...importedRules.map((rule) => rule.sourcePath)
      ],
      notes: "Start with JSON. Load source docs, skills, and rules only when the task needs them."
    }
  };

  upsertById(projectIndex.projects, {
    id,
    name,
    technologyFamilyId,
    path: `config/projects/${id}.json`,
    summary
  });

  await writeRootJson(rootPath, "config/projects/index.json", projectIndex);
  await writeRootJson(rootPath, `config/projects/${id}.json`, project);
  await writeRootText(rootPath, `docs/repos/${id}.md`, buildImportedProjectDoc(project, sourceDocs, importedSkills, importedRules));
  await writeRootJson(rootPath, "config/skills/skills.json", skillCatalog);
  await writeRootJson(rootPath, "config/rules/rules.json", ruleCatalog);
  changedPaths.push("config/projects/index.json", `config/projects/${id}.json`, `docs/repos/${id}.md`, "config/skills/skills.json", "config/rules/rules.json");

  return actionOk(actionId, `新增项目 ${name}，导入 ${importedSkills.length} 个 skill、${importedRules.length} 条 rule。`, changedPaths);
}

async function addScene({ rootPath, actionId, body }) {
  const id = normalizeId(body?.sceneId || body?.name);
  if (!id) {
    return actionError(actionId, "invalid_scene_id", "新增场景需要填写场景名称或场景 ID。");
  }
  const name = String(body?.name || titleFromId(id));
  const summary = String(body?.summary || body?.purpose || `${name} 场景。`);
  const projectIds = listFromBody(body?.projectIds);
  const sceneIndex = await readRootJson(rootPath, "config/scenes/index.json", { version: 1, scenes: [] });
  const projectIndex = await readRootJson(rootPath, "config/projects/index.json", { version: 1, projects: [] });
  const projects = await loadProjectsByIds(rootPath, projectIndex, projectIds);

  const scene = {
    version: 1,
    id,
    name,
    summary,
    purpose: String(body?.purpose || summary),
    source: { path: `docs/scenes/${id}.md` },
    projects: projects.map((project) => ({ id: project.id, name: project.name, summary: project.summary })),
    rules: []
  };

  const changedPaths = [];
  upsertById(sceneIndex.scenes, {
    id,
    name,
    summary,
    path: `config/scenes/${id}.json`,
    sourcePath: `docs/scenes/${id}.md`
  });
  await writeRootJson(rootPath, "config/scenes/index.json", sceneIndex);
  await writeRootJson(rootPath, `config/scenes/${id}.json`, scene);
  await writeRootText(rootPath, `docs/scenes/${id}.md`, buildSceneDoc(scene));
  changedPaths.push("config/scenes/index.json", `config/scenes/${id}.json`, `docs/scenes/${id}.md`);

  for (const project of projects) {
    project.scenes = project.scenes || [];
    upsertById(project.scenes, { id, name, summary, sourcePath: `docs/scenes/${id}.md` });
    await writeRootJson(rootPath, `config/projects/${project.id}.json`, project);
    changedPaths.push(`config/projects/${project.id}.json`);
  }

  return actionOk(actionId, `新增场景 ${name}，已挂载 ${projects.length} 个项目。`, changedPaths);
}

async function addSkillFromPath({ rootPath, actionId, body }) {
  const skillPath = body?.skillPath ? path.resolve(String(body.skillPath)) : "";
  if (!skillPath) {
    return actionError(actionId, "invalid_skill_path", "新增技能需要填写 skill 路径。");
  }
  const skillDir = await resolveSkillDir(skillPath);
  if (!skillDir) {
    return actionError(actionId, "invalid_skill_path", `未找到 SKILL.md: ${skillPath}`);
  }
  const skillCatalog = await readRootJson(rootPath, "config/skills/skills.json", { version: 1, skills: [] });
  const imported = await importSkillDirectory(rootPath, skillDir, {
    id: normalizeId(body?.skillId || path.basename(skillDir)),
    name: body?.name,
    description: body?.description,
    projectIds: listFromBody(body?.projectIds),
    catalog: skillCatalog
  });
  await writeRootJson(rootPath, "config/skills/skills.json", skillCatalog);
  imported.changedPaths.push("config/skills/skills.json");
  const projectIndex = await readRootJson(rootPath, "config/projects/index.json", { version: 1, projects: [] });
  const projects = await loadProjectsByIds(rootPath, projectIndex, listFromBody(body?.projectIds));
  for (const project of projects) {
    project.skills = project.skills || [];
    upsertById(project.skills, makeSkillMount(imported.skill));
    await writeRootJson(rootPath, `config/projects/${project.id}.json`, project);
    imported.changedPaths.push(`config/projects/${project.id}.json`);
  }
  return actionOk(actionId, `新增技能 ${imported.skill.name}，已挂载 ${projects.length} 个项目。`, imported.changedPaths);
}

async function addRule({ rootPath, actionId, body }) {
  const id = normalizeRuleId(body?.ruleId || body?.name);
  if (!id) {
    return actionError(actionId, "invalid_rule_id", "新增规则需要填写规则 ID 或规则名称。");
  }
  const sourcePath = body?.sourcePath ? path.resolve(String(body.sourcePath)) : "";
  const sourceStat = sourcePath ? await safeStat(sourcePath) : null;
  if (sourcePath && !sourceStat?.isFile()) {
    return actionError(actionId, "missing_rule_file", `规则文件不存在或不是文件: ${sourcePath}`);
  }
  const purpose = String(body?.purpose || "").trim();
  if (!sourceStat && !purpose) {
    return actionError(actionId, "missing_rule_content", "没有规则文件时，需要填写规则用途，系统才能生成配套 rule 文件。");
  }
  const ruleCatalog = await readRootJson(rootPath, "config/rules/rules.json", { version: 1, rules: [] });
  const imported = sourceStat
    ? await importRuleFile(rootPath, sourcePath, {
      id,
      name: body?.name || titleFromId(id),
      purpose: purpose || `Rule imported from ${path.basename(sourcePath)}.`,
      projectIds: listFromBody(body?.projectIds),
      sceneIds: listFromBody(body?.sceneIds),
      applyMode: String(body?.applyMode || "project-on-demand"),
      catalog: ruleCatalog
    })
    : await createRuleFile(rootPath, {
      id,
      name: body?.name || titleFromId(id),
      purpose,
      projectIds: listFromBody(body?.projectIds),
      sceneIds: listFromBody(body?.sceneIds),
      applyMode: String(body?.applyMode || "project-on-demand"),
      catalog: ruleCatalog
    });

  await writeRootJson(rootPath, "config/rules/rules.json", ruleCatalog);
  imported.changedPaths.push("config/rules/rules.json");
  const projectIndex = await readRootJson(rootPath, "config/projects/index.json", { version: 1, projects: [] });
  const projects = await loadProjectsByIds(rootPath, projectIndex, imported.rule.projectIds || []);
  for (const project of projects) {
    project.rules = project.rules || [];
    upsertById(project.rules, makeRuleMount(imported.rule));
    await writeRootJson(rootPath, `config/projects/${project.id}.json`, project);
    imported.changedPaths.push(`config/projects/${project.id}.json`);
  }

  const sceneIndex = await readRootJson(rootPath, "config/scenes/index.json", { version: 1, scenes: [] });
  const scenes = await loadScenesByIds(rootPath, sceneIndex, imported.rule.sceneIds || []);
  for (const scene of scenes) {
    scene.rules = scene.rules || [];
    upsertById(scene.rules, { id: imported.rule.id, name: imported.rule.name, sourcePath: imported.rule.sourcePath });
    await writeRootJson(rootPath, `config/scenes/${scene.id}.json`, scene);
    imported.changedPaths.push(`config/scenes/${scene.id}.json`);
  }

  return actionOk(actionId, `新增规则 ${imported.rule.name}，已挂载 ${projects.length} 个项目、${scenes.length} 个场景。`, imported.changedPaths);
}

async function createFileOnce(rootPath, actionId, relativePath, contents) {
  const filePath = resolveInside(rootPath, relativePath);
  try {
    await fs.access(filePath);
    return actionError(undefined, "file_exists", `File already exists: ${relativePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      return actionError(undefined, "action_failed", error.message);
    }
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
  return {
    ok: true,
    actionId,
    summary: `Created ${relativePath}`,
    output: "",
    changedPaths: [relativePath],
    nextCheckIds: ["profile_json", "person_profile_doc"]
  };
}

async function importSkillDirectory(rootPath, skillDir, options) {
  const skillFile = path.join(skillDir, "SKILL.md");
  const frontmatter = readFrontmatter(await fs.readFile(skillFile, "utf8"));
  const id = normalizeId(options.id || frontmatter.name || path.basename(skillDir));
  if (!id) throw new Error("skill id is required");
  const targetDir = resolveInside(rootPath, `bundles/skills/${id}`);
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.cp(skillDir, targetDir, { recursive: true });
  const skill = {
    id,
    name: String(options.name || frontmatter.name || titleFromId(id)),
    description: String(options.description || frontmatter.description || `Use when ${titleFromId(id)} is needed.`),
    trigger: String(options.description || frontmatter.description || `Use when ${titleFromId(id)} is needed.`),
    sourcePath: `bundles/skills/${id}/SKILL.md`,
    tags: uniqueSorted(listFromBody(options.tags)),
    defaultSceneIds: listFromBody(options.sceneIds),
    whenToLoad: String(options.description || frontmatter.description || `Use when ${titleFromId(id)} is needed.`),
    sourceExists: true,
    sourceType: "file"
  };
  upsertById(options.catalog.skills, skill);
  return { skill, changedPaths: [`bundles/skills/${id}/SKILL.md`] };
}

async function importRuleFile(rootPath, sourcePath, options) {
  const id = normalizeRuleId(options.id);
  if (!id) throw new Error("rule id is required");
  const targetPath = resolveInside(rootPath, `bundles/rules/${id}.md`);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
  const rule = buildRuleRecord({
    ...options,
    id,
    sourcePath: `bundles/rules/${id}.md`,
    sourceExists: true
  });
  upsertById(options.catalog.rules, rule);
  return { rule, changedPaths: [`bundles/rules/${id}.md`] };
}

async function createRuleFile(rootPath, options) {
  const id = normalizeRuleId(options.id);
  if (!id) throw new Error("rule id is required");
  const sourcePath = `bundles/rules/${id}.md`;
  await writeRootText(rootPath, sourcePath, `# ${options.name || titleFromId(id)}

## 用途

${options.purpose}

## 读取时机

- 当任务命中挂载的项目或场景时按需读取。
- 先读项目/场景 JSON，再根据 rule id 读取本文件。

## 执行规则

- TODO: 用 AI 根据实际项目约束补全可执行规则。
`);
  const rule = buildRuleRecord({ ...options, id, sourcePath, sourceExists: true });
  upsertById(options.catalog.rules, rule);
  return { rule, changedPaths: [sourcePath] };
}

function buildRuleRecord(options) {
  return {
    id: options.id,
    name: String(options.name || titleFromId(options.id)),
    purpose: String(options.purpose || ""),
    sourcePath: options.sourcePath,
    projectIds: listFromBody(options.projectIds),
    technologyFamilyIds: listFromBody(options.technologyFamilyIds),
    sceneIds: listFromBody(options.sceneIds),
    tags: uniqueSorted(listFromBody(options.tags)),
    scope: String(options.scope || "project"),
    whenToRead: String(options.whenToRead || "Read when this rule is mounted by the selected project or scene."),
    applyMode: String(options.applyMode || "project-on-demand"),
    globs: listFromBody(options.globs).length ? listFromBody(options.globs) : ["**/*"],
    sourceExists: options.sourceExists !== false,
    sourceType: "file"
  };
}

async function scanProjectIntroDocs(projectPath) {
  const candidates = [
    "AGENTS.md",
    "CLAUDE.md",
    "claude.md",
    "README.md",
    ".ai-configs/claude.md",
    ".claude/CLAUDE.md"
  ];
  const docs = [];
  for (const relativePath of candidates) {
    const filePath = path.join(projectPath, relativePath);
    const stat = await safeStat(filePath);
    if (stat?.isFile()) {
      docs.push({
        path: relativePath,
        content: await fs.readFile(filePath, "utf8")
      });
    }
  }
  for (const filePath of await listMarkdownFiles(path.join(projectPath, ".cursor/rules"), 1)) {
    docs.push({
      path: path.relative(projectPath, filePath).split(path.sep).join("/"),
      content: await fs.readFile(filePath, "utf8")
    });
  }
  return docs;
}

async function scanSkillDirs(projectPath) {
  const roots = [".codex/skills", ".agents/skills", ".claude/skills", "skills"];
  const dirs = [];
  for (const root of roots) {
    const absoluteRoot = path.join(projectPath, root);
    const entries = await safeReaddir(absoluteRoot);
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillDir = path.join(absoluteRoot, entry.name);
      if ((await safeStat(path.join(skillDir, "SKILL.md")))?.isFile()) {
        dirs.push(skillDir);
      }
    }
  }
  return dirs;
}

async function scanRuleFiles(projectPath) {
  return uniqueSorted([
    ...await listMarkdownFiles(path.join(projectPath, ".cursor/rules"), 2),
    ...await listMarkdownFiles(path.join(projectPath, "rules"), 3)
  ]);
}

async function listMarkdownFiles(root, depth) {
  const stat = await safeStat(root);
  if (!stat?.isDirectory() || depth < 0) return [];
  const files = [];
  const entries = await safeReaddir(root);
  for (const entry of entries) {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(filePath, depth - 1));
    } else if (/\.(md|mdc)$/i.test(entry.name)) {
      files.push(filePath);
    }
  }
  return files;
}

async function ensureProjectEntryNote(projectPath, rootPath) {
  const note = `

<!-- ai-context:managed-entry:start -->
## ai-context 协作入口

- 当前项目已接入 ai-context，请先读取 \`${path.join(rootPath, "config/entry.json")}\`。
- 命中项目后再按需读取 ai-context 中的项目、场景、skill、rule JSON。
- 不要在聊天窗口一次性加载所有上下文，按任务需要加载。
<!-- ai-context:managed-entry:end -->
`;
  const target = path.join(projectPath, "AGENTS.md");
  const existing = await readOptionalText(target);
  if (existing?.includes("<!-- ai-context:managed-entry:start -->")) {
    return "";
  }
  await fs.writeFile(target, `${existing || `# ${path.basename(projectPath)}\n`}${note}`, "utf8");
  return target;
}

function buildImportedProjectDoc(project, sourceDocs, skills, rules) {
  const docLines = sourceDocs.length
    ? sourceDocs.map((doc) => `- \`${doc.path}\``).join("\n")
    : "- 未发现 AGENTS、CLAUDE、README 或 Cursor rules 文档。";
  const skillLines = skills.length ? skills.map((skill) => `- \`${skill.id}\` ${skill.name}`).join("\n") : "- 无";
  const ruleLines = rules.length ? rules.map((rule) => `- \`${rule.id}\` ${rule.name}`).join("\n") : "- 无";
  return `# ${project.name}

## 项目定位

${project.summary}

## 项目路径

\`${project.path}\`

## 发现的项目说明文档

${docLines}

## ai-context 读取规则

- 用户选择该项目后，先读取 \`config/projects/${project.id}.json\`。
- 只有 JSON 摘要不足时，再读取本文件和项目内原始说明文档。
- skill 与 rule 只按挂载关系按需加载，减少聊天窗口上下文。

## 已导入 Skills

${skillLines}

## 已导入 Rules

${ruleLines}
`;
}

function buildSceneDoc(scene) {
  const projectLines = scene.projects.length ? scene.projects.map((project) => `- \`${project.id}\` ${project.name}`).join("\n") : "- 暂未挂项目";
  return `# ${scene.name}

## 场景用途

${scene.purpose || scene.summary}

## 挂载项目

${projectLines}

## 关系读取

- 进入该场景时先读 \`config/scenes/${scene.id}.json\`。
- 场景下的 rules 通过 \`config/rules/rules.json\` 解析，再按需读取 rule 文件。
`;
}

async function loadProjectsByIds(rootPath, projectIndex, ids) {
  const projectById = new Map((projectIndex.projects || []).map((project) => [project.id, project]));
  const projects = [];
  for (const id of ids) {
    const indexEntry = projectById.get(id);
    if (!indexEntry) throw new Error(`Unknown projectId: ${id}`);
    projects.push(await readRootJson(rootPath, indexEntry.path || `config/projects/${id}.json`));
  }
  return projects;
}

async function loadScenesByIds(rootPath, sceneIndex, ids) {
  const sceneById = new Map((sceneIndex.scenes || []).map((scene) => [scene.id, scene]));
  const scenes = [];
  for (const id of ids) {
    const indexEntry = sceneById.get(id);
    if (!indexEntry) throw new Error(`Unknown sceneId: ${id}`);
    scenes.push(await readRootJson(rootPath, indexEntry.path || `config/scenes/${id}.json`));
  }
  return scenes;
}

function makeSkillMount(skill) {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    sourcePath: skill.sourcePath,
    whenToLoad: skill.whenToLoad
  };
}

function makeRuleMount(rule) {
  return {
    id: rule.id,
    name: rule.name,
    purpose: rule.purpose,
    sourcePath: rule.sourcePath,
    applyMode: rule.applyMode,
    globs: rule.globs || ["**/*"],
    whenToRead: rule.whenToRead
  };
}

async function resolveSkillDir(skillPath) {
  const stat = await safeStat(skillPath);
  if (stat?.isDirectory() && (await safeStat(path.join(skillPath, "SKILL.md")))?.isFile()) return skillPath;
  if (stat?.isFile() && path.basename(skillPath) === "SKILL.md") return path.dirname(skillPath);
  return "";
}

function summarizeProject(name, docs) {
  const firstDoc = docs.find((doc) => doc.content.trim());
  if (!firstDoc) return `${name} 项目。`;
  const line = firstDoc.content
    .split(/\r?\n/)
    .map((item) => item.replace(/^#+\s*/, "").trim())
    .find(Boolean);
  return line ? `${name}: ${line}` : `${name} 项目。`;
}

function inferTechnologyFamily(projectPath, packageJson) {
  const normalized = projectPath.split(path.sep).join("/");
  const deps = Object.keys({
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies
  }).join(" ");
  if (normalized.includes("/frontend/") || /(react|vue|vite|next|webpack|taro)/i.test(deps)) return "frontend";
  if (normalized.includes("/node/") || /(egg|koa|midway|tegg)/i.test(deps)) return "bff";
  if (normalized.includes("/ios/") || /\.(xcworkspace|xcodeproj)$/i.test(normalized)) return "ios";
  if (normalized.includes("ai-context")) return "workflow";
  return "unknown";
}

function inferRepoType(technologyFamilyId, packageJson) {
  if (technologyFamilyId === "frontend") return packageJson ? "web-app" : "frontend-repository";
  if (technologyFamilyId === "bff") return "service";
  if (technologyFamilyId === "ios") return "ios-app";
  if (technologyFamilyId === "workflow") return "context-config-center";
  return "repository";
}

function readFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    result[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return result;
}

async function readRootJson(rootPath, relativePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(resolveInside(rootPath, relativePath), "utf8"));
  } catch (error) {
    if (fallback !== undefined && error?.code === "ENOENT") return structuredClone(fallback);
    throw error;
  }
}

async function readOptionalJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function readOptionalText(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function writeRootJson(rootPath, relativePath, value) {
  const filePath = resolveInside(rootPath, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeRootText(rootPath, relativePath, value) {
  const filePath = resolveInside(rootPath, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
}

async function safeStat(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function safeReaddir(dirPath) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

function upsertById(list, item) {
  const index = list.findIndex((current) => current.id === item.id);
  if (index === -1) list.push(item);
  else list[index] = { ...list[index], ...item };
}

function listFromBody(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value).split(/[,，\s]+/).map((item) => item.trim()).filter(Boolean);
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function normalizeId(value) {
  return String(value || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeRuleFileId(value) {
  return normalizeId(value) || "rule";
}

function normalizeRuleId(value) {
  return String(value || "")
    .split("/")
    .map(normalizeId)
    .filter(Boolean)
    .join("/");
}

function titleFromId(value) {
  return String(value || "")
    .split(/[/-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function actionOk(actionId, summary, changedPaths) {
  return {
    ok: true,
    actionId,
    summary,
    output: "",
    changedPaths: uniqueSorted(changedPaths),
    nextCheckIds: ["config_json_valid", "graph_relationships"]
  };
}

async function runFixedCommand(rootPath, command, actionId) {
  const result = await runCommand(command, { cwd: rootPath, timeoutMs: COMMAND_TIMEOUT_MS });
  return {
    ok: result.ok,
    actionId,
    summary: result.ok ? `Ran ${command.join(" ")}` : `Failed ${command.join(" ")}`,
    output: result.output,
    changedPaths: [],
    nextCheckIds: ["install_check_command", "install_validate_command"]
  };
}

function runCommand(command, { cwd, timeoutMs }) {
  return new Promise((resolve) => {
    const child = spawn(command[0], command.slice(1), { cwd, stdio: ["ignore", "pipe", "pipe"] });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({ ok: false, output: "Command timed out." });
    }, timeoutMs);
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ ok: false, output: error.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output: output.trim() });
    });
  });
}

function actionError(actionId, code, message) {
  return {
    ok: false,
    actionId,
    error: { code, message },
    summary: message,
    output: "",
    changedPaths: [],
    nextCheckIds: []
  };
}
