# XUANJIAN Symphony Roadmap

> 目标：先用 G0-G5 Gate 文件协议解决单聊天框上下文过重、跨项目交接不稳定、验收打回不清楚的问题；稳定后再升级成半自动或自动调度服务。

## 背景

单个 Codex 聊天框可以跨项目读写代码，但不适合长期承载完整研发流水线。Jira 任务经常只有一句话，需要先读描述、备注和链接，再判断 Bug / 新功能；新增功能还可能需要查 PC、参考移动端已有页面、补产品/UI、生成 Figma、写技术方案、拆项目开发，最后验收功能和 UI。

这套流程只面向 L3 / L4 复杂任务。L1 小任务、L2 中任务、影响范围清楚的普通 Bug，仍然在一个 Chat 内按 `ai-my-pm` 和必要的 superpowers 处理，不进入 G0-G5 文件化流程。

如果当前 Chat 支持子 Agent，且任务可以由同一聊天框承载，优先用子 Agent 做并行调研、代码走查、review 或分项目执行。只有上下文、写入范围或验收打回已经超出单 Chat + 子 Agent 能力时，才进入 G0-G5 文件化流程。

因此第一阶段不直接做 daemon，而是先把真正复杂任务里主 PM Chat 到项目执行 Chat 的交接包标准化。

## 第一阶段：G0-G5 文件化 Gate

落地位置：

```text
/Users/xj/Documents/ai-context
```

核心文件：

```text
scenes/xuanjian-symphony.md
templates/00-intake.md
templates/01-discovery.md
templates/02-product-ui.md
templates/03-tech-plan.md
templates/04-project-handoff.md
templates/05-project-result.md
templates/06-acceptance.md
templates/07-rework.md
runtime/tasks/README.md
```

核心流程：

```text
G0 Intake
-> G1 Discovery
-> G2 Product/UI
-> G3 Tech Plan
-> G4 Development
-> G5 Acceptance
-> Human Review
```

验收标准：

- 每个任务可以落到 `runtime/tasks/<ticket-key>/`。
- PM Chat 能从 Jira 地址生成 `00-intake.md`。
- 需求采集能写入 `01-discovery.md`，包括接口信息和数据来源。
- 没有产品/UI 时，能进入 `02-product-ui.md` 并记录 Figma 设计和多轮确认。
- 用户确认 `03-tech-plan.md` 后，才允许从 `master` 创建 `xuanjian/...` 分支。
- 项目执行 Chat 可以只靠 `04-<project>-handoff.md` 启动。
- 每个项目 Agent 必须按 handoff 执行自己的 superpowers；superpower 产物写入 `superpowers/<project>/`。
- 如果 `writing-plans` 生成实施计划，PM 审核该 superpower 产物后才能开发。
- 开发结果写入 `05-<project>-result.md`。
- 验收 Agent 使用 `06-acceptance.md` 检查功能和 UI/Figma 一致性。
- 不通过时使用 `07-rework.md` 打回对应项目。

## 第二阶段：半自动调度

候选项目：

```text
/Users/xj/Documents/xuanjian-symphony
```

职责：

- 读取 Jira。
- 创建任务目录。
- 生成或更新 `00-intake.md`。
- 根据当前 Gate 提醒下一步。
- 生成项目执行 Chat 启动语。
- 汇总 `05-<project>-result.md` 和 `07-rework.md`。
- 不自动写代码，不自动改 Jira 状态。

适合在第一阶段模板稳定后开始。

## 第三阶段：自动调度服务

职责：

- 轮询 Jira。
- 按 Gate 状态启动 PM / Research / Dev / QA agent。
- 管理 workspace。
- 回写 Jira 评论和状态。
- Design QA 不通过时自动生成返工任务并重新分发。

约束：

- 自动调度服务只执行文档协议。
- `ai-context` 仍是上下文源。
- worker agent 不默认读取完整 `ai-context`。
- 高风险任务仍需要人工确认。
