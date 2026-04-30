# XUANJIAN Symphony Roadmap

> 目标：先用文件协议解决单聊天框上下文过重、跨项目交接不稳定的问题；稳定后再升级成自动调度服务。

## 背景

单个 Codex 聊天框可以跨项目读写代码，但不适合长期承载完整研发流水线。Jira 一句话需求经常需要先调研 PC、参考 App、补需求、画 Figma，再进入开发和设计验收。

因此第一阶段不直接做 daemon，而是把主 PM Chat 到项目执行 Chat 的交接包标准化。

## 第一阶段：文件化任务交接包

落地位置：

```text
/Users/xj/Documents/ai-context
```

新增核心：

```text
scenes/xuanjian-symphony.md
scenes/agents/pc-research-agent.md
scenes/agents/reference-research-agent.md
scenes/agents/design-qa-agent.md
templates/*.md
runtime/tasks/README.md
```

核心流程：

```text
Jira 一句话
-> PM Router intake
-> 需求澄清 / PC Research / Reference Research
-> Requirement Draft
-> Figma Design
-> Dev Handoff
-> 项目执行 Chat
-> Design QA
-> Rework / Human Review
```

验收标准：

- 每个任务可以落到 `runtime/tasks/<ticket-key>/`。
- 项目执行 Chat 可以只靠 `dev-handoff.md` 开始工作。
- 开发完成后能用 `design-qa.md` 判断通过、条件通过或打回。

## 第二阶段：半自动调度

候选项目：

```text
/Users/xj/Documents/node/xuanjian-symphony
```

职责：

- 读取 Jira。
- 创建任务目录。
- 生成或更新 intake。
- 根据任务状态提醒用户下一步。
- 生成项目执行 Chat 启动语。
- 不自动写代码，不自动改 Jira 状态。

适合在第一阶段模板稳定后开始。

## 第三阶段：自动调度服务

职责：

- 轮询 Jira。
- 按状态启动 PM / Research / Dev / QA agent。
- 管理 workspace。
- 回写 Jira 评论和状态。
- Design QA 不通过时自动生成返工任务。

约束：

- 自动调度服务只执行文档协议。
- `ai-context` 仍是上下文源。
- 不把所有 agent 都暴露给完整长期上下文。
- 高风险任务仍需要人工确认。

## 当前建议

先使用第一阶段 1-2 个真实 Jira 任务试跑。等模板和状态机稳定后，再建设第二阶段的 Node 调度项目。
