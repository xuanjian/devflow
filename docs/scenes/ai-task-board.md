# Scene: ai-task-board

## 定位

`ai-task-board` 是 XUANJIAN 的任务状态层和未来面板的数据语义层。

它不负责取代 superpowers 驱动开发流程。所有开发、排障、文档、联调、调研和上下文维护任务，仍然优先由 superpowers 的流程推进，通常从 `superpowers:brainstorming` 开始，再按任务需要进入 `writing-plans`、`test-driven-development`、`systematic-debugging`、`verification-before-completion` 或 review 类 superpower。

`ai-task-board` 负责把这个流程“看得见”：记录任务大小、当前 G1-G7 Gate、涉及项目、角色分工、验证路径、阻塞点和恢复位置，让当前聊天和未来面板都能清楚知道任务执行到哪一步。

## 适用场景

- 用户只说“我要做什么需求”，需要把任务规模、项目范围和当前阶段展示出来。
- 任务进入开发流程后，需要记录当前 Gate、下一步、阻塞点或恢复位置。
- 任务涉及多个仓库、多个端或多个技术域，例如 H5 + BFF + iOS + 小程序。
- 需要为未来面板沉淀任务状态，而不是只在聊天里临时说明。
- Jira / Notion / Figma 只给了一个入口，需要在 task board 里记录调研、方案、开发、验收和归档阶段。
- 用户明确提到 `ai-task-board`、任务看板、任务状态、G1-G7、当前步骤、面板、任务大小或执行进度。

## 与 superpowers 的协作关系

superpowers 是流程驱动层，`ai-task-board` 是状态展示层。

1. superpowers 负责决定怎么推进：头脑风暴、计划、TDD、系统调试、验证、review。
2. `ai-task-board` 负责记录推进到了哪里：任务等级、Gate、项目、角色、阻塞、验证结果。
3. 当用户中途补充引导、提出限制或处理权限确认后，补充内容进入 task board 状态；原 superpower 流程继续从中断点恢复。
4. `ai-task-board` 不能把原开发任务替换成“只处理刚才那句引导”；它必须保留主任务栈和下一步。
5. 除非用户明确改变目标、取消任务或要求暂停，否则处理完插话/权限/阻塞后要回到原任务的剩余步骤。

## 状态记录职责

- 任务等级：L1 / L2 / L3 / L4。
- 当前 Gate：G1 / G2 / G3 / G4 / G5 / G6 / G7。
- 影响范围：单仓 / 跨仓 / 跨端 / 高风险模块。
- 项目范围：命中的 `config/projects/*.json` 和 `config/scenes/*.json`。
- 角色分工：Architect、Explorer、Frontend、BFF、iOS、QA、Reviewer；未启用真实 subagent 时作为本地 checklist。
- superpowers 流程：当前已进入哪个 superpower，下一步应该继续哪个 superpower。
- 验证路径：构建、测试、lint、浏览器、模拟器、接口验证或人工未验证区域。
- 阻塞与恢复：权限确认、冲突、账号、外部系统、用户决策，以及恢复后的主任务下一步。
- 面板字段：状态、进度、风险、产物、已验证项、未验证项、交接说明。

## 任务等级

### L1 小任务

- 单文件、小样式、小文案、小 bug。
- 影响范围清楚，不涉及跨仓协作。
- 记录为轻量 task board 状态，不强制完整 G1-G7。
- 完成前仍使用 `verification-before-completion` 做最小验证。

### L2 中任务

- 一个页面、一个接口、一个局部联调链路。
- 通常需要 `brainstorming` 或 `writing-plans` 先明确方案。
- task board 记录项目范围、当前步骤、验证路径和风险。

### L3 大任务

- 跨仓、跨端、跨业务域需求。
- 例如管理端移动 H5 + BFF + iOS 原生 + 小程序。
- task board 启用完整 G1-G7 记录，并展示每个项目的进度和阻塞。
- 只有用户明确授权并行/多 agent/subagent 时才 spawn Codex subagent。

### L4 高风险任务

- 认证、支付、权限、库存、数据迁移、发布脚本、跨仓重构。
- 必须记录回滚、验证、review 和发布风险。
- task board 启用完整 G1-G7，并把高风险确认点明确展示出来。

## G1-G7 Gate

G1-G7 是 task board 的面板状态，不是 superpowers 的替代流程。

```text
G1 Intent / Intake
-> G2 Discovery
-> G3 Plan / Product UI
-> G4 Development
-> G5 Integration
-> G6 Acceptance
-> G7 Run / Package Archive
```

### G1 Intent / Intake

- 记录用户目标、任务类型、可能项目、未知项和任务等级。
- 对应 superpowers：通常从 `brainstorming` 开始。

### G2 Discovery

- 记录已读取的 project/scene JSON、源码、规则、Figma、Notion、浏览器证据或历史文档。
- Bug 记录复现、现象、预期、疑似模块和证据。

### G3 Plan / Product UI

- 记录技术方案、产品/UI 决策、调研结论和用户确认点。
- 对应 superpowers：通常由 `brainstorming` 过渡到 `writing-plans`。

### G4 Development

- 记录当前写入项目、写入范围、已加载规则、已加载 skill 和验证预期。
- 对应 superpowers：实现类任务按 `test-driven-development` 或已确认的计划推进。

### G5 Integration

- 记录跨项目运行方式、依赖顺序、本地链接、包版本、代理/环境切换和 BFF/前端/原生协作。
- 只记录选中项目，不默认扩展到 scene 中所有项目。

### G6 Acceptance

- 记录需求、方案、UI/Figma、API/数据契约和 diff 验收结果。
- 对应 superpowers：声明完成前必须进入 `verification-before-completion`。

### G7 Run / Package Archive

- 记录如何调试/运行、如何联调、如何测试/预发/正式打包、最终验证、已知缺口和交接说明。

## 写入位置

活动任务状态记录在：

```text
runtime/current.json
runtime/tasks/<task-id>.json
config/tasks/gates.json
```

`docs/templates/*.md` 是可选的人类可读模板。当前状态以 JSON 为准。

## 输出要求

启用 `ai-task-board` 时，最终回复按任务复杂度包含：

- 任务等级：L1 / L2 / L3 / L4
- 当前 Gate：G1-G7
- superpowers 流程：当前使用哪个，下一步继续哪个
- 项目与技术判断：涉及哪些项目、模块、技术路线
- 执行状态：正在做什么、已完成什么、阻塞点是什么
- 验证状态：已验证、未验证、残余风险
