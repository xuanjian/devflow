# ai-context

> XUANJIAN 的统一 AI 上下文中心仓库。这里存放跨工具、跨项目复用的上下文源文件、场景定义、注册表和入口生成脚本。

## 设计目标

- 长期画像、当前工作、项目说明、链路场景只维护少量源文件
- Codex、Cursor、Claude Code 等工具只维护薄入口，不再各自维护大段正文
- 允许一个项目属于多个链路场景，也允许一次任务横跨前端、iOS、BFF、ComfyUI
- 允许插件项目、工具项目、实验项目与业务项目共存，但默认加载不同的上下文深度

## 目录结构

- `person/`
  - 个人长期画像入口、学习记录和画像候选
- `runtime/`
  - 当前工作上下文入口
- `runtime/tasks/`
  - XUANJIAN Symphony 第一阶段任务交接包目录，每个 Jira 或临时需求一个文件夹
- `repos/`
  - 单仓库上下文说明
- `scenes/`
  - 高频工作链路 / 工作场景
- `templates/`
  - Jira intake、需求调研、开发交接、Design QA 等可复用模板
- `registry/`
  - 仓库、场景、bundle 的注册表
- `bundles/`
  - 规则包与技能包的源文件
  - 其中既可以有全局共享内容，也可以有项目专属但集中维护的内容
- `scripts/`
  - 生成与同步脚本
- `docs/`
  - 方案、迁移计划、设计说明

## 读取顺序

新会话进入任一项目时，推荐按以下顺序恢复上下文：

1. 项目根目录的入口文件，例如 `AGENTS.md` / `CLAUDE.md` / Cursor rule
2. `ai-context/person/profile.md`
3. `ai-context/runtime/current-work.md`
4. `ai-context/repos/<repo>.md`
5. 必要时再加载 `ai-context/scenes/<scene>.md`
6. 需要精确定位规则或技能时，再查询 `ai-context/registry/bundles.json`
7. 如果任务涉及个人能力成长、学习沉淀或“同步长期画像”，再读取 `ai-context/scenes/profile-growth.md`
8. 如果用户只描述开发需求，或任务涉及 AI PM 调度、任务轻重判断、多角色分工、跨仓大任务或“ai-my-pm / ai-dev-team”，再读取 `ai-context/scenes/ai-my-pm.md`
9. 如果 DHB/HXB 项目路由不清楚，再读取 `ai-context/registry/notion-sources.json` 中登记的 Notion `DHB 项目地图`
10. 如果任务涉及 Jira 一句话需求、需求调研、PC/参考 App 反推需求、Figma 原型、跨聊天框交接或 Design QA 验收，再读取 `ai-context/scenes/xuanjian-symphony.md`

兼容入口仍保留：

- `/Users/xj/AGENTS.md`
- `/Users/xj/WORK_CONTEXT.md`

这两个文件只作为跨目录、跨工具的稳定跳板；权威正文以 `person/profile.md` 和 `runtime/current-work.md` 为准。

常见链路的可视化总览见：

- `docs/scene-repo-bundle-overview.md`

## 当前状态

- 新入口和注册表统一迁移到 `/Users/xj/Documents/ai-context`
- 旧目录 `_dhb-ai-context` 已退役并移除
- 各仓库的桥接文件由 `scripts/generate-adapters.mjs` 批量生成
- 项目目录中的 rules / skills 正文已全部收拢到 `ai-context`，项目侧保留的是入口文件或 symlink
- 所有 git 仓库都会由生成器自动写入本地 `.git/info/exclude`，并对已跟踪的 AI 配置文件设置 `skip-worktree`
- `registry/bundles.json` 会记录每个 rule/skill bundle 的路径、类型、作用范围和绑定仓库
- `registry/clients.json` 记录 Codex / Cursor / Claude Code 等 AI client 的入口能力
- `registry/repo-tools.json` 记录不同 family 和关键 repo 可使用的 Figma、Notion、Xcode、Playwright、BFF 调试等工具能力
- `registry/notion-sources.json` 记录 Notion 中的 DHB 项目地图、项目总览、核心项目详情和术语约定入口

## 本地 git 忽略策略

- 目标：不把个人 AI 协作配置提交到远程仓库
- 作用范围：仅本地生效，不修改项目的 `.gitignore`
- 当前忽略模式：
  - `AGENTS.md`
  - `CLAUDE.md`
  - `.cursor/`
  - `.trae/`
  - `.codex/`
  - `.ai-configs/`
  - `.agents/`
- 对已经被 git 跟踪过的上述文件，生成器会额外设置本地 `skip-worktree`

## 当前已收拢的规则来源

- 前端共享规则：
  - `bundles/rules/shared-context.mdc`
  - `bundles/rules/dhbfront-cash-mini.mdc`
  - `bundles/rules/dhb-mobile-index.mdc`
  - `bundles/rules/theme-config.mdc`
  - `bundles/rules/i18n-chinese-key.mdc`
- 项目专属但集中维护：
  - `bundles/rules/customize-mini-program/*`
  - `bundles/rules/new-mobile-h5/*`
  - `bundles/rules/dhb-international-mobile/*`
  - `bundles/rules/ios-dhb/*`

## 当前已收拢的技能来源

- 前端共享技能：
  - `bundles/skills/run-projects`
  - `bundles/skills/restore-local-env`
  - `bundles/skills/dhb-env-switch`
- 项目专属但集中维护：
  - `bundles/skills/dhb-packages/*`
  - `bundles/skills/dhbfront-cash-mini/add-subpackage-module`
  - `bundles/skills/dhbfront-cash-mini/update-subpackage-module`
  - `bundles/skills/dhbfront-manager-mobile/add-bff-service`
- 个人 AI PM 与多角色协作技能：
  - `bundles/skills/ai-my-pm`

## 当前已新增的 AI PM 规则

- `scenes/ai-my-pm.md`
  - 定义任务分级、上下文读取、工具选择、多角色执行模式、写入规则
- `scenes/xuanjian-symphony.md`
  - 定义 Jira 到需求调研、Figma、开发交接和 Design QA 的第一阶段文件化工作流
- `bundles/skills/ai-my-pm/SKILL.md`
  - 定义 Codex 中如何执行 ai-my-pm 流程

当前策略：

- 默认不安装、不依赖 `oh-my-codex`、`oh-my-openagent`、AgentsRoom 或其它外部 harness
- 优先使用 Codex 原生能力
- 用户只需要描述需求；`ai-my-pm` 默认自动判断怎么实施、用哪些项目、哪些工具、哪些流程、哪些技术和哪些角色
- DHB/HXB 相关需求如果项目归属不清楚，优先参考 Notion `DHB 项目地图`
- `ai-my-pm` 自动判断是否需要 superpowers：需求不清用 brainstorming，多步任务用 writing-plans，失败排查用 systematic-debugging，完成前用 verification-before-completion，大改用 requesting-code-review
- `ai-my-pm` 是总控入口，先判断任务轻重、上下文、工具和执行模式
- `ai-dev-team mode` 只是 `ai-my-pm` 里的大任务多角色执行模式
- 没有用户明确授权时，`ai-dev-team mode` 只作为角色化思考框架
- 如果用户明确授权多 agent / subagent / 并行，才使用 Codex subagent
- `xuanjian-symphony` 是当前新增的第一阶段交接协议：主 PM Chat 生成 `runtime/tasks/<ticket-key>/dev-handoff.md`，项目执行 Chat 只读取任务包和目标项目入口，避免单聊天框上下文过重

## 长期画像自动增长

长期画像采用分层增长机制：

- `runtime/current-work.md` 记录当前阶段和临时工作状态
- `person/learning-log.md` 记录项目中学到的新知识、工具经验和可复用排查方法
- `person/profile-candidates.md` 记录可能晋升到长期画像的能力变化
- `person/profile.md` 只保留稳定、通用、有用的长期信息

当用户明确说“同步长期画像”“把这个记到长期画像”“以后都按这个来”，或候选已满足稳定、通用、有用三项标准时，AI 可以自动更新 `person/profile.md`，并说明晋升原因和证据来源。`/Users/xj/AGENTS.md` 仅保留兼容入口。
