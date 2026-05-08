# ai-context

> XUANJIAN 的本地 AI 上下文中心。现在采用“JSON 索引层 + 原始 Markdown / rules / skills 按需加载”的结构，减少默认上下文消耗，同时保留完整说明文件。

## 核心原则

- 先读 JSON 索引，不默认读完整 Markdown。
- 项目、场景、规则、Skill 的关系用 JSON 描述。
- `docs/repos/*.md`、`docs/scenes/*.md`、`bundles/rules/**`、`bundles/skills/**` 继续保留，只有命中任务时再读。
- Skill 不反向列项目；项目 JSON 负责声明自己挂载哪些 Skill。
- 当前工作状态来自 `runtime/current.json` 和 `runtime/tasks/<task-id>.json`，不再维护 `runtime/current-work.md`。

## 默认读取顺序

新会话或项目入口先读：

1. `config/entry.json`
2. `config/profile.json`
3. `runtime/current.json`
4. `runtime/tasks/<activeTaskId>.json`
5. 命中的 `config/projects/<project-id>.json`
6. 命中的 `config/scenes/<scene-id>.json`
7. 需要选 Skill 时读 `config/skills/skills.json`
8. 需要规则细节时读 `config/rules/rules.json`

只有当 JSON 索引说明需要更详细上下文时，再读对应源文件。

## 目录分工

```text
config/
  entry.json                 # 总入口：读取顺序、安装方式、G1-G7 流程
  profile.json               # 长期画像摘要，指向 docs/person/profile.md
  projects/*.json            # 每个项目一个索引：doc、scene、skill、rule
  scenes/*.json              # 每个场景一个索引：作用、组合原因、项目、运行/联调方式
  skills/skills.json         # Skill catalog，不反向列项目
  rules/rules.json           # Rule catalog
  tasks/gates.json           # G1-G7 定义

docs/person/profile.md            # 长期画像正文，按需读取
docs/repos/*.md                   # 项目介绍正文，按需读取
docs/scenes/*.md                  # 场景正文，按需读取
docs/templates/*.md               # G1-G7 任务产物模板
docs/prototypes/                  # 配置软件原型
bundles/rules/**             # 规则正文，按需读取
bundles/skills/**            # Skill 正文和脚本，按需读取
runtime/current.json         # 当前任务指针
runtime/tasks/               # 任务状态与产物
scripts/install-ai-context.mjs
```

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
