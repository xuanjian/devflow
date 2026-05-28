# DevFlow

`DevFlow` 是给 AI 编程工具使用的本地上下文和任务状态工作台。

它不负责替代 Codex、Claude Code、Cursor、OpenSpec 或 superpowers。它负责保存项目关系、规则/技能索引、任务状态和恢复点，让 Agent 在需要时只读取最小上下文。

核心原则：

> DevFlow 是按需能力集合，不是每个新对话的默认完整流程。

新对话开始时，Agent 应先根据用户输入判断是否需要 DevFlow，以及只需要哪一项能力：

- `none`：普通问答、解释、代码片段，不读取 DevFlow。
- `resume`：续接任务，只读当前任务、Workset、下一步和恢复点。
- `light`：小 bug 或小改动，只做最小上下文和轻量记录。
- `full`：大需求、跨项目、高风险或外部 PRD/工单/设计输入，才进入完整任务追踪、G1-G7 或 OpenSpec。

## 这个工具有什么用

- 管理本机项目、项目关系、场景模板、规则和技能入口。
- 帮 Agent 从需求里推断最小工作集，而不是一次性加载所有资料。
- 保存任务状态、验证结果、阻塞项、下一步和恢复点。
- 支持 Codex、Claude Code、Cursor 等工具读取同一套本地状态。
- 保持公开模板干净；个人画像、公司项目、任务证据只在本机初始化后生成。

刚安装的公开模板只包含：

- 1 个项目：`DevFlow`
- 无默认场景配置
- 2 个核心 skill：`devflow`、`devflow-init`
- 空 rules
- 空当前任务

真实项目、个人画像、历史任务、公司规则和任务证据不属于公开模板。

## 安装

```bash
npm install -g @xuanmimi/devflow --registry=https://registry.npmjs.org/
devflow init
```

指定工具：

```bash
devflow init --tools codex,claude-code,cursor
```

如果当前目录没有 DevFlow checkout，`devflow init` 会创建 `./devflow`。也可以指定目录：

```bash
devflow init --dir ~/.local/share/devflow
```

安装后，在 AI 工具里运行 `devflow-init`，用对话方式生成本机私有 profile、项目清单、场景模板、规则和技能。

## 聊天入口

```text
@devflow:init
@devflow:add /path/to/project
@devflow:add scene-template 前后端联调
@devflow:add skill /path/to/skill
@devflow:add rule bff/error-handling
@devflow:del project old-project
@devflow:del skill old-skill
@devflow:del rule old/rule
@devflow:del scene-template old-scene
@devflow:task 新增订单导出功能
@devflow:panel
```

- `@devflow:init`：首次配置本机资料；如果还没有个人画像，AI 会通过选项式提问帮你整理。
- `@devflow:add`：登记项目、场景模板、skill 或 rule。
- `@devflow:del`：移除 DevFlow 登记关系，不删除真实业务仓库。
- `@devflow:task`：创建、续接或更新可恢复任务。
- `@devflow:panel`：打开或查看任务/项目看板。

当需求还很模糊或比较大时，AI 应给出几个可选方向，用户可以选 `1/2/3` 或直接修改选项。普通小改不强制使用 OpenSpec，也不强制完整 G1-G7。

## 面板

```bash
cd devflow
npm install
npm run dev
```

面板读取同一套本地状态：

- 当前任务和当前步骤
- Workset 或项目组合
- 下一步和恢复点
- 项目、场景模板、skill、rule 关系
- 配置检查结果

面板是观察层，不是新增配置的主入口。新增项目、规则、技能优先通过 AI 聊天里的 `@devflow:add`。

## 公开模板边界

公开模板可以包含：

- 通用安装脚本
- 通用文档
- 通用 schema
- 空示例配置
- 不含个人和公司信息的通用 skill / rule

公开模板不应该包含：

- 个人画像
- 公司项目路径
- 真实项目关系
- 任务 JSON 和任务证据
- 内部工单、接口、截图、账号线索
- token、账号、密钥、cookie

## 文档

- [docs/install.md](docs/install.md)：安装、初始化、隐私边界和排障。
- [docs/project-introduction.md](docs/project-introduction.md)：DevFlow 信息模型和任务状态说明。
- [docs/product/devflow-workset-redesign.md](docs/product/devflow-workset-redesign.md)：动态 Workset 改造产品文档。
