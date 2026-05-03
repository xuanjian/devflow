# Scene: xuanjian-symphony

> XUANJIAN 专属的 Jira 需求到研发验收工作流。外层由本文件定义固定 Gate；内层按需使用 superpowers 做澄清、方案、TDD、调试、验证和 review。

## 一句话定位

`xuanjian-symphony` 不是复制官方 Symphony，也不是把所有 agent 名称堆起来。它只做一件事：把一条 Jira 或临时需求，从“读任务”推进到“你最终验收”，中间每个阶段都有明确产物和是否能继续的闸口。

## 适用场景

- 用户给 Jira 地址，需要读取标题、描述、备注、附件和链接。
- Jira 描述里可能带 Figma、Notion、产品原型、UI、接口文档或录屏链接。
- 任务可能是 Bug，也可能是新增功能、改版、联调或调研。
- 需求可能需要先问用户、查 PC 端代码和页面、参考移动端已有功能或参考外部 App。
- 没有产品/UI 时，需要按现有移动端风格设计 Figma，并和用户多轮确认。
- 开发前必须有技术方案文档，用户审核后才建分支。
- 多项目开发时，需要给每个项目执行 Chat 生成自己的上下文和开发任务。
- 开发后必须验收功能、需求边界、接口数据来源和 UI/Figma 一致性，不通过打回。

## 核心原则

- `ai-context` 的全局上下文只给 PM Chat 读取；项目执行 Chat 默认只读自己的任务包。
- 不让一句话 Jira 直接进入开发。
- 不清楚就问用户，不凭空补业务规则。
- Bug 先走复现、影响项目、模块、根因和改法判断；新增功能先走需求采集和产品/UI确认。
- 有产品/UI 就读取并对齐；没有产品/UI 才进入 Figma 设计。
- 开发文档必须由用户审核通过后，才能创建分支和进入开发。
- 每个开发 Agent 必须先写自己的开发计划，PM Chat 通过后才能改代码。
- 验收 Agent 不直接改代码，只写通过/不通过/返工单。
- 第一阶段用文件做跨对话框通信；后续调度服务只能执行这些文件协议。

## 6 个 Gate

```text
G0 Intake
-> G1 Discovery
-> G2 Product/UI
-> G3 Tech Plan
-> G4 Development
-> G5 Acceptance
-> Human Review
```

### G0 Intake：读 Jira 和任务分类

目标：

- 读取 Jira 标题、描述、备注、附件和链接。
- 判断任务类型：Bug / 新功能 / 改版 / 联调 / 调研 / 设计。
- 提取 Figma、Notion、产品原型、UI、接口文档、录屏、截图链接。
- 判断是否缺少产品原型或 UI；缺少时问用户是否有。

产物：

```text
runtime/tasks/<ticket-key>/00-intake.md
```

进入下一 Gate 的条件：

- Jira 关键信息已采集。
- 任务类型有初步判断。
- 已列出缺失信息和需要问用户的问题。

### G1 Discovery：采集足够信息

Bug 任务重点采集：

- 哪个产品、项目、模块、页面或接口出问题。
- 复现路径、当前表现、期望表现、影响范围。
- 可能的代码位置、数据来源、接口和错误日志。
- 初步根因和改法选择。

新增功能重点采集：

- 目标用户、入口、业务目标、页面范围和不做范围。
- 是否有产品设计和 UI。
- PC 端是否已有此功能，若有则查 PC 页面、代码、接口、状态、权限。
- 移动端是否有相似功能可参照。
- 是否需要参考外部 App、截图、录屏或竞品流程。
- 接口信息、老接口、数据来源、字段来源、状态和权限。

产物：

```text
runtime/tasks/<ticket-key>/01-discovery.md
```

进入下一 Gate 的条件：

- Bug 已能说明项目、模块、复现、影响范围和建议改法。
- 新功能已能说明需求边界、页面范围、数据来源和仍需设计/确认的内容。
- 不清楚的问题已经问过用户，或被明确记录为待确认。

### G2 Product/UI：产品和 UI 设计

跳过条件：

- Jira、备注或用户已提供可用产品原型和 UI。
- 现有 Figma/Notion 已足够作为开发依据。

需要执行时：

- 先读取现有移动端页面、组件和 Figma 风格。
- 设计必须和当前移动端风格一致，不做风格迥异的新视觉。
- 创建或更新 Figma 原型。
- 和用户多轮沟通，直到产品流程和 UI 都确认。

产物：

```text
runtime/tasks/<ticket-key>/02-product-ui.md
```

进入下一 Gate 的条件：

- 有明确 Figma / Notion / 原型链接，或明确本任务不需要 UI。
- 页面结构、交互、状态、空态、异常和主要文案已确认。

### G3 Tech Plan：开发文档和分支准备

目标：

- 根据需求和原型生成开发文档。
- 写清楚涉及项目、技术方案、实现方式、接口、老接口、数据来源。
- 写清楚前端页面、组件、服务、状态逻辑和文件规划。
- 写清楚 BFF / iOS / 小程序 / PC 是否需要改。
- 文档要结合产品和 UI 页面风格，附上原型或 UI 链接。
- 用户多轮审核，确认后才能创建分支。

分支规则：

```text
功能分支：xuanjian/<ticket-key>-<feature-name>
Bug 分支：xuanjian/bugfix-<ticket-key>-<bug-name>
```

分支来源默认：

```text
master
```

产物：

```text
runtime/tasks/<ticket-key>/03-tech-plan.md
```

进入下一 Gate 的条件：

- 用户确认技术方案。
- 每个项目的写入范围和验证方式明确。
- 分支已从 `master` 创建，或明确由用户手动创建。

### G4 Development：分项目 TDD 开发

目标：

- 给每个涉及项目生成独立 handoff。
- 每个项目执行 Chat 读取自己的 handoff。
- 每个开发 Agent 先写自己的开发计划文档，PM Chat 审核通过后才能开发。
- 开发过程按任务风险使用 TDD、debug、verification 等 superpowers。

典型产物：

```text
runtime/tasks/<ticket-key>/04-frontend-handoff.md
runtime/tasks/<ticket-key>/04-bff-handoff.md
runtime/tasks/<ticket-key>/04-ios-handoff.md

runtime/tasks/<ticket-key>/05-frontend-dev-plan.md
runtime/tasks/<ticket-key>/05-bff-dev-plan.md
runtime/tasks/<ticket-key>/05-ios-dev-plan.md

runtime/tasks/<ticket-key>/05-frontend-result.md
runtime/tasks/<ticket-key>/05-bff-result.md
runtime/tasks/<ticket-key>/05-ios-result.md
```

进入下一 Gate 的条件：

- 所有涉及项目都有开发结果说明。
- 关键构建、测试、lint、浏览器、接口或模拟器验证已执行，或明确说明为什么不能执行。
- 每个项目列出改动文件、验证结果和剩余风险。

### G5 Acceptance：验收和打回

目标：

- 验收 Agent 对照需求文档、Figma/UI、沟通结论、接口数据来源和开发结果检查。
- 验收不只是功能，还包括 UI 一致性、文案、布局、状态、空态、异常、权限和边界。
- 不通过时生成返工单，说明打回哪个项目、哪个 Agent、依据是什么、期望怎么改。
- 返工后重新回到 G4，对应项目重做，再进入 G5。

产物：

```text
runtime/tasks/<ticket-key>/06-acceptance.md
runtime/tasks/<ticket-key>/07-rework.md
```

进入 Human Review 的条件：

- 验收结论为通过，或有条件通过且用户接受剩余偏差。
- 所有高/中风险问题已关闭。
- UI/Figma 一致性已经明确检查。

## 任务包目录

每个任务一个目录：

```text
runtime/tasks/<ticket-key>/
  00-intake.md
  01-discovery.md
  02-product-ui.md
  03-tech-plan.md
  04-<project>-handoff.md
  05-<project>-dev-plan.md
  05-<project>-result.md
  06-acceptance.md
  07-rework.md
```

`<project>` 使用简短项目标识，例如：

```text
frontend
bff
ios
mini-program
pc
```

## 模板来源

```text
templates/00-intake.md
templates/01-discovery.md
templates/02-product-ui.md
templates/03-tech-plan.md
templates/04-project-handoff.md
templates/05-dev-plan.md
templates/05-dev-result.md
templates/06-acceptance.md
templates/07-rework.md
```

## 多对话框通信协议

### PM Chat

PM Chat 负责：

- 读取 Jira 和全局上下文。
- 维护 `runtime/tasks/<ticket-key>/`。
- 审核 G1 / G2 / G3 / G5 产物。
- 生成各项目 handoff。
- 接收各项目 result。
- 根据验收结果分发返工。

### 项目执行 Chat

项目执行 Chat 启动语：

```text
读取 /Users/xj/Documents/ai-context/runtime/tasks/<ticket-key>/04-<project>-handoff.md。
先生成 05-<project>-dev-plan.md，等待 PM Chat 审核通过后再开发。
```

项目执行 Chat 只读：

- 自己的 `04-<project>-handoff.md`。
- handoff 明确列出的需求、Figma、技术方案和项目入口。
- 当前项目代码。

项目执行 Chat 不默认读：

- 完整 `ai-context`。
- 其他项目 handoff。
- 其他项目开发结果，除非 PM Chat 指定。

### 验收 Chat / 验收 Agent

验收 Chat 读取：

- `00-intake.md`
- `01-discovery.md`
- `02-product-ui.md`
- `03-tech-plan.md`
- 所有 `05-<project>-result.md`
- Figma / Notion / UI 链接

验收 Chat 输出：

- `06-acceptance.md`
- 必要时输出 `07-rework.md`

## superpowers 使用方式

`xuanjian-symphony` 是外层工作流；superpowers 是内层执行纪律。

| 阶段 | 推荐 superpower |
| --- | --- |
| G0 / G1 需求不清 | `brainstorming` |
| G3 生成开发文档 | `writing-plans` |
| G4 开始开发 | `test-driven-development` |
| G4 遇到失败或线上 Bug 根因不清 | `systematic-debugging` |
| G4 开发完成前 | `verification-before-completion` |
| G5 验收或大改完成 | `requesting-code-review` |
| G5 返工处理 | `receiving-code-review` |

不要为了形式加载全部 superpowers。按当前 Gate 的风险选择最小必要集合。

## Jira 读取边界

理想情况：

- PM Chat 能直接读取 Jira 地址、描述、备注、附件和链接。

读不到时：

- 让用户贴 Jira 标题、描述、备注或截图。
- 如果链接需要登录态或权限，先说明无法直接读取，不猜测内容。

## 第二阶段演进

第一阶段先用文件通信。稳定后再建设半自动调度服务：

```text
/Users/xj/Documents/node/xuanjian-symphony
```

第二阶段服务只做：

- 轮询或读取 Jira。
- 创建任务目录。
- 生成 `00-intake.md` 初稿。
- 根据当前 Gate 提醒下一步。
- 生成项目执行 Chat 启动语。
- 汇总 result 和 rework。

第二阶段不替代本文件协议，也不默认自动改代码。
