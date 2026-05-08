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

当前 active rules 已收敛为 9 条，active skills 已收敛为 6 个。`config/rules/rules.json` 和 `config/skills/skills.json` 是唯一 catalog；归档到 `docs/reference/**` 的旧文件不再参与默认挂载。

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

检查：

```bash
node scripts/install-ai-context.mjs check
```

校验 JSON 索引：

```bash
node scripts/install-ai-context.mjs validate
```

安装 Codex Skill 和全局入口：

```bash
node scripts/install-ai-context.mjs install
```

卸载 Skill 软链接：

```bash
node scripts/install-ai-context.mjs uninstall
```

同步项目入口文件：

```bash
node scripts/install-ai-context.mjs sync-projects
```

安装脚本管理的 Codex Skill 软链接：

```text
~/.agents/skills/ai-context -> /Users/xj/Documents/ai-context/bundles/skills/ai-context
```

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
