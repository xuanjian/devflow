# Scene: xuanjian-symphony

> XUANJIAN 专属的需求调研、项目交接、开发验收流水线。这里不是复制官方 Symphony，而是先把 Jira / ai-context / PC 代码 / 参考 App / Figma / Codex 项目会话之间的交接标准固定下来。

## 适用场景

- Jira 任务只有一句话，需要先调研和补需求。
- 一个需求可能要参考 PC 端已有功能、类似 App、竞品流程或现有 Figma 风格。
- 主聊天框上下文已经很重，需要把工作拆到具体项目聊天框执行。
- 需要让开发完成后对照需求文档、Figma 原型和沟通结论做验收，不通过就打回重做。
- 后续准备把手工交接升级为自动调度服务。

## 总体原则

- 第一阶段只做任务交接包，不做自动 daemon。
- 主 PM Chat 负责分诊、调研组织、产物归档和验收判断。
- 项目执行 Chat 负责在一个明确项目里完成代码修改和验证。
- `ai-context` 的全局上下文只给 PM Router 使用；worker agent 默认只读取任务包和目标项目入口。
- 所有任务都沉淀到 `runtime/tasks/<ticket-key>/`，避免把关键决策只留在聊天记录里。
- 不要让一句话 Jira 直接进入开发；需求不清时先进入澄清或调研。

## 目录约定

每个任务一个目录：

```text
runtime/tasks/<ticket-key>/
  intake.md
  pc-research.md
  reference-research.md
  requirement.md
  figma.md
  dev-handoff.md
  design-qa.md
```

允许按任务实际情况缺省文件。例如纯 Bug 不一定需要 `reference-research.md` 和 `figma.md`。

模板来源：

```text
templates/jira-intake-report.md
templates/pc-research-report.md
templates/reference-research-report.md
templates/requirement-draft.md
templates/dev-handoff.md
templates/design-qa-report.md
```

## 状态机

```text
New
-> Intake
-> Need Clarification
-> PC Research
-> Reference Research
-> Requirement Draft
-> Figma Design
-> Ready for Dev
-> In Dev
-> Build Verification
-> Design QA
-> Rework / Human Review
-> Done
```

状态含义：

- `New`：Jira 原始任务刚进入，尚未判断。
- `Intake`：PM Router 读取 Jira、`ai-context`、当前工作上下文，判断任务类型和影响范围。
- `Need Clarification`：需求不足，必须向用户补问。
- `PC Research`：需要从 PC 页面、代码、接口和权限逻辑反推业务事实。
- `Reference Research`：需要从参考 App、竞品、截图或录屏提取流程和交互。
- `Requirement Draft`：整理移动端需求、字段、流程、状态和验收标准。
- `Figma Design`：按需求和现有产品风格画原型。
- `Ready for Dev`：需求和原型已确认，可以生成开发交接包。
- `In Dev`：项目执行 Chat 或后续自动 worker 正在开发。
- `Build Verification`：开发侧完成构建、测试、页面或接口验证。
- `Design QA`：对照需求、Figma、沟通结论和现有风格验收。
- `Rework`：验收不通过，生成返工单并打回开发。
- `Human Review`：机器验收通过，等待 XUANJIAN 或团队最终确认。
- `Done`：已完成。

## Agent 分工

### PM Router Agent

读取：

- `person/profile.md`
- `runtime/current-work.md`
- `scenes/ai-my-pm.md`
- 本文件
- 必要时读取 `repos/*.md`、`registry/*.json`、Notion 项目地图

负责：

- 判断 Bug / 新功能 / 改版 / 联调 / 调研 / 设计 / 高风险任务。
- 判断 L1 / L2 / L3 / L4。
- 判断需要哪些调研 agent。
- 判断是否必须问用户。
- 建立 `runtime/tasks/<ticket-key>/` 任务目录。
- 生成 `intake.md` 和后续任务包。

不负责：

- 直接凭一句话需求写代码。
- 把所有 worker 都塞进同一个聊天上下文。

### Clarifier Agent

负责把不清楚的 Jira 转成少量高价值问题。一次优先问最阻塞的问题，不要一次性抛出长问卷。

输出到：

```text
runtime/tasks/<ticket-key>/intake.md
```

### PC Research Agent

规则见：

```text
scenes/agents/pc-research-agent.md
```

输出到：

```text
runtime/tasks/<ticket-key>/pc-research.md
```

### Reference Research Agent

规则见：

```text
scenes/agents/reference-research-agent.md
```

输出到：

```text
runtime/tasks/<ticket-key>/reference-research.md
```

### Requirement Writer Agent

负责把 intake、PC 调研、参考调研和用户确认合并成移动端需求文档。

输出到：

```text
runtime/tasks/<ticket-key>/requirement.md
```

### Figma Designer Agent

负责按已确认需求和现有产品风格画 Figma 原型。它只能在需求基本稳定后启动。

输出到：

```text
runtime/tasks/<ticket-key>/figma.md
```

### Dev Handoff Agent

负责把已确认需求转成项目执行 Chat 可直接使用的任务包。

输出到：

```text
runtime/tasks/<ticket-key>/dev-handoff.md
```

### Design QA Agent

规则见：

```text
scenes/agents/design-qa-agent.md
```

输出到：

```text
runtime/tasks/<ticket-key>/design-qa.md
```

## 主 Chat 到项目 Chat 的交接方式

主 PM Chat 生成 `dev-handoff.md` 后，项目执行 Chat 只需要读取：

```text
/Users/xj/Documents/ai-context/runtime/tasks/<ticket-key>/dev-handoff.md
```

项目执行 Chat 的第一句话可以是：

```text
读取 /Users/xj/Documents/ai-context/runtime/tasks/<ticket-key>/dev-handoff.md，按里面的目标项目、写入范围和验收标准执行。
```

项目执行 Chat 不默认读取完整 `ai-context`，除非 `dev-handoff.md` 明确要求。

## 通过条件

一个任务进入 `Ready for Dev` 前，至少要有：

- 明确目标用户和入口。
- 明确页面、接口或业务流程范围。
- 明确必须保留、可以简化、不做的内容。
- 明确验收标准。
- 如果需要设计，明确 Figma 链接或待画原型说明。

一个任务进入 `Human Review` 前，至少要有：

- 开发侧验证结果。
- Design QA 结论为通过，或明确列出人工接受的偏差。
- 关键差异、未验证项和风险已写入 `design-qa.md`。

## 第二阶段演进

第一阶段稳定后，再建设自动调度服务。候选路径：

```text
/Users/xj/Documents/node/xuanjian-symphony
```

第二阶段服务只负责自动化这些动作：

- 轮询 Jira。
- 创建任务目录。
- 调用 PM Router 生成 intake。
- 根据状态启动对应 agent 或生成 handoff。
- 回写 Jira 状态和评论。
- 在 Design QA 不通过时生成返工任务。

第二阶段不能替代当前文档协议；它只能执行这些协议。
