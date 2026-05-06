# Xuanjian Symphony Architecture

> 目标：参考 OpenAI Symphony 的调度思想，搭建 XUANJIAN 自己的 Jira / Figma / Notion / Codex 多 Agent 编排控制台。

## 当前结论

`xuanjian-symphony` 不应长期停留在“生成文件后人工复制给多个聊天窗口”的形态。文件可以作为第一阶段的审计和产物记录，但正式目标应该是：

```text
Web Console
-> Orchestrator Service
-> Task / Artifact Store
-> Workspace Manager
-> 多 Codex app-server Workers
-> Acceptance / Rework Loop
```

OpenAI Symphony 的参考价值主要是调度模型，而不是直接复用 Elixir 实现。

## 参考 OpenAI Symphony 的核心概念

### 1. Orchestrator

负责轮询任务、选择可执行任务、控制并发、处理重试、停止失效任务、记录运行状态。

对应到 Xuanjian Symphony：

- 读取手动任务；Jira / Notion / 未来其它任务来源作为后续适配器。
- 判断任务是 L1/L2/L3/L4。
- L1/L2 仍可交给当前 Chat。
- L3/L4 进入控制台 Gate。
- 控制每个任务哪些 Agent 可以启动。
- 关键产物未确认时，不允许进入下一 Gate。

### 2. Workflow / Policy

OpenAI Symphony 用 `WORKFLOW.md` 承载项目内规则和 prompt。Xuanjian Symphony 应复用 `ai-context` 作为上层策略中心：

- `scenes/xuanjian-symphony.md`：Gate 流程。
- `scenes/ai-my-pm.md`：需求路由。
- `person/profile.md`：长期画像。
- `runtime/current-work.md`：当前上下文。
- `templates/*`：任务产物模板。

后续具体项目也可以拥有自己的 `WORKFLOW.md` 或等价配置。

### 3. Workspace

每个任务、每个项目执行都应有隔离 workspace。第一阶段可以先映射到现有本地项目路径，后续再支持自动 clone / worktree。

建议规则：

```text
任务级 workspace: runtime/tasks/<ticket-key>/
项目级 workspace: <repo-path> + branch/worktree
worker 运行记录: runtime/tasks/<ticket-key>/workers/<worker-id>/
```

### 4. Codex app-server Worker

正式目标不是多个聊天窗口，而是由 Orchestrator 启动多个 `codex app-server`：

```text
thread/start
turn/start
stream events
tool calls
turn completion
retry / continuation
```

第一版不必直接完成多 worker 并发，但后端数据模型和页面必须预留：

- worker 状态。
- thread id / turn id。
- workspace path。
- 当前 token / 日志 / 最近事件。
- 失败原因。
- retry attempt。

### 5. Observability

控制台不是装饰页面，而是操作面：

- 任务池。
- Gate 进度。
- 待确认产物。
- Agent / Worker 状态。
- 运行日志。
- 验收和返工。
- 每个任务的 Jira / Figma / Notion / 技术方案 / 开发结果 / 验收报告链接。

## Xuanjian Symphony 组件

### Web Console

第一版页面采用“左侧任务栏 + 右侧编排详情”的工作台：

- 不设独立左侧功能菜单，避免出现不能点击或作用不清的装饰导航。
- 左侧固定为更窄的任务栏：显示任务 key、标题、状态、当前 Gate，只负责选任务。
- 新建任务入口属于任务栏操作：桌面端在任务栏标题旁放 `+`，点击后弹出新建任务弹窗；右侧任务详情不放新建任务表单。
- 新建任务弹窗中，任务描述使用多行大输入框，并支持上传图片和文件；附件先随任务本地保存，后续再替换成真实上传服务。
- 右侧详情是主操作区：
  - 当前任务怎么操作。
  - Gate 进度。
  - 待确认产物。
  - PM 沟通中心。
  - PM 决策过程。
  - Agent 输入 / 输出 / 产物追溯。
  - Agent / Worker 状态。
  - 最终验收反馈。
  - 运行日志。
  - 任务信息。

手机端不显示桌面任务栏，也不铺开任务池。手机端结构：

```text
顶部：当前任务 + 切换任务 + 新建任务
中间：当前任务详情 / PM 沟通 / 待确认产物 / 验收反馈
底部：任务 / PM / 产物 / 验收
```

### Orchestrator Service

职责：

- 从 Jira 导入任务。
- 生成 intake。
- 判断任务类型和等级。
- 创建任务产物。
- 控制 Gate 状态。
- 阻止未确认产物继续推进。
- 接收用户给 PM Agent 的补充、纠错和验收反馈。
- 根据用户反馈生成返工单并分派给对应 Agent。
- 启动 Discovery / Design / Dev / Acceptance Agent。
- 后续对接多 Codex app-server worker。

### Artifact Store

第一阶段可以用本地文件，后续可以迁移到 SQLite 或 Postgres。

核心产物：

```text
00-intake.md
01-discovery.md
02-product-ui.md
03-tech-plan.md
04-<project>-handoff.md
05-<project>-result.md
06-acceptance.md
07-rework.md
```

每个产物都需要状态：

```text
Draft
Pending User Review
Approved
Rejected
Superseded
```

待确认产物必须能从控制台直接打开，并提供：

```text
打开
通过
驳回
```

驳回时必须记录原因，并把任务退回对应 Gate。

### Agent Types

- PM Orchestrator：读全局上下文，判断 Gate 和分配任务。
- Jira Intake Agent：读取 Jira 标题、描述、备注、附件、链接。
- Discovery Agent：采集需求、项目、接口、数据源。
- PC Research Agent：扒 PC 现有页面、代码、业务流程。
- Reference Research Agent：参考移动端已有功能或外部 App。
- Design Agent：必要时生成 Figma / 页面原型。
- Project Dev Agent：按项目执行 superpowers 和开发。
- Acceptance Agent：验收功能、需求边界、UI/Figma 一致性。

用户日常主要和 PM Orchestrator 沟通。其它 Agent 的对话和输出是追溯信息，不是用户必须逐个管理的主入口。

PM 的关键判断必须输出结构化决策过程：

```text
事实
假设
依据
判断
下一步动作
信心 / 风险
可纠错点
```

控制台不展示模型内部原始思维链，而是展示可审计、可复盘、可纠错的决策记录。

## AIAGENT-93 MVP 范围

第一阶段只实现足够跑通自举流程的 MVP：

1. 页面原型回到 G2 待确认：控制台使用“左侧任务栏 + 右侧编排详情”布局，不保留独立功能菜单。
2. 支持手动创建任务；暂不接 Jira 导入。
3. 任务包可生成 G0/G1/G2/G3 文档。
4. 控制台必须展示待确认产物。
5. 控制台必须支持 PM 沟通中心、最终验收反馈、PM 决策过程。
6. 技术方案确认前不启动开发。

暂不做：

- 常驻 daemon。
- 真正多 Codex app-server 并发。
- Jira / Notion / Figma 自动导入。
- 自动创建 PR / 自动合并。
- 多租户和权限系统。

## 下一步

生成 `AIAGENT-93` 实施计划，创建 `/Users/xj/Documents/xuanjian-symphony`，先实现 Web Console + Orchestrator MVP。Codex app-server worker 在第一版只保留适配层和 mock 状态。
