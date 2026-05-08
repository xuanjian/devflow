# ai-context

> XUANJIAN 的本地 AI 上下文中心。现在采用“JSON 索引层 + 原始 Markdown / rules / skills 按需加载”的结构，减少默认上下文消耗，同时保留完整说明文件。

## 核心原则

- 先读 JSON 索引，不默认读完整 Markdown。
- 项目、场景、规则、Skill 的关系用 JSON 描述。
- `docs/repos/*.md`、`docs/scenes/*.md`、`bundles/rules/**`、`bundles/skills/**` 继续保留，只有命中任务时再读。
- Active rules 统一使用 `.md`；`.mdc` 只作为 Cursor 入口适配或旧资料保存在 `docs/reference/**`。
- `bundles/rules/**` 和 `bundles/skills/**` 只放 active 短入口；长示例和历史版本放 `docs/reference/**`。
- Skill 不反向列项目；项目 JSON 负责声明自己挂载哪些 Skill。
- 场景可以挂 rules；场景 JSON 的 `rules` 用 `scene-on-demand` 触发跨项目联调规则。
- 当前工作状态来自 `runtime/current.json` 和 `runtime/tasks/<task-id>.json`，不再维护 `runtime/current-work.md`。

## 默认读取顺序

新会话或项目入口先读：

1. `config/entry.json`
2. `config/profile.json`
3. `runtime/current.json`
4. `runtime/tasks/<activeTaskId>.json`
5. `config/projects/index.json`，先用它选择候选项目
6. 命中的 `config/projects/<project-id>.json`
7. `config/scenes/index.json`，当任务涉及场景或多项目链路时先用它选择候选场景
8. 命中的 `config/scenes/<scene-id>.json`
9. 需要选 Skill 时读 `config/skills/skills.json`
10. 需要规则细节时读 `config/rules/rules.json`

只有当 JSON 索引说明需要更详细上下文时，再读对应源文件。

`index.json` 只做候选列表和路由入口；真正的项目/场景关系、挂载 skill、rules 和源文档路径在命中的详情 JSON 中。

## 目录分工

```text
config/
  entry.json                 # 总入口：读取顺序、安装方式、G1-G7 流程
  profile.json               # 长期画像摘要，指向 docs/person/profile.md
  projects/*.json            # 每个项目一个索引：doc、scene、skill、rule
  scenes/*.json              # 每个场景一个索引：作用、组合原因、项目、运行/联调方式
  skills/skills.json         # Skill catalog，不反向列项目
  rules/rules.json           # Rule catalog，声明 applyMode / globs / whenToRead
  tasks/gates.json           # G1-G7 定义

docs/person/profile.md            # 长期画像正文，按需读取
docs/repos/*.md                   # 项目介绍正文，按需读取
docs/scenes/*.md                  # 场景正文，按需读取
docs/templates/*.md               # G1-G7 任务产物模板
docs/prototypes/                  # 配置软件原型
docs/reference/**                 # 旧规则、旧 skill、长示例，只作为参考
bundles/rules/**             # active 短规则，统一 .md，按需读取
bundles/skills/**            # active Skill 和必要脚本，按需读取
runtime/current.json         # 当前任务指针
runtime/tasks/               # 任务状态与产物
scripts/install-ai-context.mjs
```

## Active Bundles

当前 active rules 已收敛为 15 条，active skills 已收敛为 6 个。`config/rules/rules.json` 和 `config/skills/skills.json` 是唯一 catalog；归档到 `docs/reference/**` 的旧文件不再参与默认挂载。

Rules 的“全局还是按需”不靠文件后缀表达，而由 JSON 元数据表达：

- `applyMode`: `global`、`project-on-demand`、`scene-on-demand`、`task-gate` 或 `manual`
- `globs`: 适用的文件范围
- `whenToRead`: AI 什么时候应该读取规则正文

触发链路：

- 选中项目 -> 读取 `config/projects/<project-id>.json` -> 加载项目挂载的 `project-on-demand` rules。
- 选中场景 -> 读取 `config/scenes/<scene-id>.json` -> 加载场景挂载的 `scene-on-demand` rules。
- 到 G6/G7 等任务阶段 -> 按 `task-gate` rules 做验收、发布和归档。

被合并的重点：

- `run-projects`、`dhb-env-switch`、`restore-local-env` -> `dhb-local-env`
- `create-api-request`、`mock-api-from-curl` -> `dhb-api-from-curl`
- `add-subpackage-module`、`update-subpackage-module` -> `dhb-subpackage-release`
- iOS DHB 规则从 22 条收敛为 `ios-dhb/core`、`ios-dhb/networking`、`ios-dhb/release-check`

## 安装与检查

新环境或疑似配置不完整时，先跑 doctor：

```bash
node scripts/contextctl.mjs doctor
```

检查：

```bash
node scripts/install-ai-context.mjs check
```

校验 JSON 索引：

```bash
node scripts/install-ai-context.mjs validate
```

安装 ai-context Skill：

```bash
node scripts/install-ai-context.mjs install
```

如果是在一台本机开发环境里首次配置，并且希望所有已注册项目都能在项目目录下直接发现已挂载 skills，使用：

```bash
node scripts/install-ai-context.mjs install --project-skills
```

它只会安装中心 skill 链接，并把各项目 JSON 中声明的 skills 同步为项目本机 `.agents/.codex/.claude` 下的软链接；不会改业务源码或项目入口文件。

如果其它电脑上的项目路径和 JSON 里的绝对路径不同，可以给安装脚本一个本机项目搜索根目录：

```bash
AI_CONTEXT_PROJECT_ROOTS="$HOME/Documents" node scripts/install-ai-context.mjs install --project-skills
```

也可以精确覆盖单个项目路径：

```bash
AI_CONTEXT_PROJECT_PATH_OVERRIDES="dhb-packages=$HOME/work/DHB_PACKAGES" \
  node scripts/install-ai-context.mjs sync-projects --project dhb-packages --skills-only --write
```

项目 skills 同步以 `config/projects/<project-id>.json` 为准：

- 新增 skill：下次执行 `install --project-skills` 或 `sync-projects --skills-only --write` 会自动创建项目本机软链接。
- 删除 skill：下次同步会清理已不在 JSON 中声明、且指向 `ai-context/bundles/skills` 的托管软链接。
- 用户自己放的外部 skill 链接不会被清理。

卸载 Skill 软链接：

```bash
node scripts/install-ai-context.mjs uninstall
```

同步项目入口文件：

```bash
node scripts/install-ai-context.mjs sync-projects
```

`sync-projects` 默认只预览将要写入的项目入口文件，不修改业务仓库。确认只在本机同步时再显式写入：

```bash
node scripts/install-ai-context.mjs sync-projects --project dhbfront-cash-mini --entries-only --write
```

入口同步只生成 `AGENTS.md`、`CLAUDE.md`、`.ai-configs/claude.md`、`.claude/CLAUDE.md` 和 `.cursor/rules/00-ai-context.mdc`。项目根目录小写 `claude.md` 是旧入口清理目标：只有确认是 ai-context 托管内容时才删除；人工写的非托管内容会保护跳过并提示人工确认。dry-run 会区分 create / update / unchanged / protected skip / remove legacy entry。

安装脚本默认同时管理三个 Skill 软链接，兼容 Codex、Claude Code 和旧入口环境：

```text
~/.agents/skills/ai-context -> <ai-context-root>/bundles/skills/ai-context
~/.codex/skills/ai-context -> <ai-context-root>/bundles/skills/ai-context
~/.claude/skills/ai-context -> <ai-context-root>/bundles/skills/ai-context
```

家目录下的 `AGENTS.md`、`CLAUDE.md`、`WORK_CONTEXT.md` 不再作为默认安装产物；ai-context 入口以 Skill 软链接和本仓库 JSON 索引为准。

安装不负责默认扫描整台电脑或自动建立项目地图。安装只保证 ai-context 能被 Codex / Claude 等工具发现；项目导入、标签归纳和 skill 挂载属于维护动作，必须由用户指定单个仓库路径或明确的工作目录后再执行。这样可以避免把临时仓库、废弃项目、下载目录或不该纳入的敏感项目写进上下文。

## 维护入口

日常维护不要手工同时改多份 JSON / Markdown。优先使用 `contextctl`。

项目地图采用“轻量安装、按需导入”的方式维护：

- `install`：只安装 ai-context 入口和 skill 软链接，不默认扫项目。
- `add project <repo-path>`：导入一个明确项目，并归纳项目属性。
- 批量扫描工作目录：只有在用户明确指定 root 时才做；当前优先通过逐个 `add project` 落地，后续如果新增 `contextctl init --root <work-root>`，也必须先预览候选项目并让用户确认。

新增项目时，只需要先给项目路径：

```bash
node scripts/contextctl.mjs add project "$HOME/Documents/frontend/example-project"
```

固定流程：

1. 脚本根据路径自动推断项目 id、名称、技术族、repoType、summary 和 tags。
2. 让维护者选择要挂载的 scenes。
3. 让维护者选择要挂载的 project rules。
4. 让维护者选择要挂载的 skills。
5. 自动生成 `docs/repos/<id>.md`、`config/projects/<id>.json`，更新 `config/projects/index.json`。
6. 自动把项目加入所选 scene JSON，并把项目写入所选 rule 的 metadata。
7. 自动执行 `node scripts/install-ai-context.mjs validate`。

非交互模式给 Codex 或批处理用：

```bash
node scripts/contextctl.mjs add project "$HOME/Documents/frontend/example-project" \
  --id example-project \
  --family frontend \
  --scenes single-repo-change \
  --rules frontend/core \
  --skills dhb-local-env \
  --yes
```

新增 skill 时，也要先归纳它的能力边界，而不是把它当成某个真实项目：

```bash
node scripts/contextctl.mjs add skill "$PWD/bundles/skills/example-skill"
```

固定原则：

1. skill catalog 记录 skill 是什么：`id`、`name`、`description`、`trigger`、`sourcePath`、能力 tags 和默认 scenes。
2. skill tags 是能力标签，例如 `api`、`curl`、`frontend`、`mock`、`ui`，不是项目 id。
3. 项目是否使用某个 skill，要写进 `config/projects/<project-id>.json` 的 `skills` 字段。
4. 如果新增 skill 需要默认挂到一类项目，可以用 `--family <family>`；如果只挂到指定项目，用 `--projects <a,b,c>`。
5. 新增或调整后执行 `node scripts/install-ai-context.mjs validate`；需要同步本机项目 skill 链接时，再执行 `sync-projects --skills-only --write`。

tags 的边界：

- 通用 tags 可以迁移，例如 `frontend`、`bff`、`ios`、`mobile`、`library`、`web-app`。
- 个人或公司业务 tags 需要按本机项目重新归纳，例如本机的 `dhb`、`hxb`、`packages`、`cash-mini` 不应作为其它电脑的默认画像。
- tags 只作为路由线索；真实关系以项目 JSON、scene JSON、rule catalog 和 skill catalog 的显式字段为准。

脚本能力不足时，先扩展 `contextctl`，再做维护；不要靠记忆手工同步多个索引。

## G1-G7

任务流程定义在 `config/tasks/gates.json`：

- G1 Intent / Intake
- G2 Discovery
- G3 Plan / Product UI
- G4 Development
- G5 Integration
- G6 Acceptance
- G7 Run / Package Archive

G7 需要记录如何调试运行、如何联调、测试/预发/正式如何打包、验证结果和归档注意事项。

## 配置软件原型

当前 HTML 只是产品原型：

```text
docs/prototypes/context-studio.html
```

后续真正的软件代码放到 `src/`。
