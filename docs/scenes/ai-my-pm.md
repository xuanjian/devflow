# Scene: ai-my-pm

## 定位

`ai-my-pm` 是 XUANJIAN 的唯一 AI PM 总控场景。

它负责把一句需求自动路由成可执行工作：判断项目、场景、技术栈、工具、流程、角色、验证方式，以及是否需要进入 G1-G7 Gate。

## 适用场景

- 用户只说“我要做什么需求”，没有指定项目、工具、流程或技术方案。
- 需要从需求反推项目、技术栈、工具、角色、流程和验证方式。
- 任务涉及多个仓库、多个端或多个技术域，例如 H5 + BFF + iOS + 小程序。
- 需要判断是否使用 Notion、Figma、Playwright、Xcode、BFF 调试或项目专属 skill。
- 需要并行搜索资料、梳理字段口径、比对 Notion / Figma / 代码实现。
- Jira / Notion / Figma 只给了一个入口，需要先调研、补需求、拆方案、交接项目或验收打回。
- 用户明确提到 `ai-my-pm`、AI PM、项目调度、任务轻重判断、工具选择、技能选择、多角色分工或 `ai-dev-team`。

## 触发顺序

`ai-my-pm` 是流程路由层，触发顺序在 superpowers 之前。

1. 用户提出开发、排障、文档、联调、调研或上下文整理需求。
2. 先进入 `ai-my-pm`，判断任务类型、等级、项目、场景、工具和验证方式。
3. `ai-my-pm` 再按任务风险选择是否加载具体 superpower。
4. 如果任务是 L3/L4，或明确需要 intake、discovery、plan、handoff、acceptance、archive，再启用 G1-G7 Gate。
5. 如果任务是 L1/L2，直接按选中的项目 JSON、scene JSON、rules、skills 和最小验证推进。

结论：不是先触发某个 superpower 再决定流程，而是先由 `ai-my-pm` 做分诊；superpowers 是它选择出来的执行纪律。

## 当前策略

- 默认使用 Codex 原生能力，不安装、不依赖外部 harness。
- 用户只需要描述需求；`ai-my-pm` 默认负责自动判断怎么实施、用哪些项目、哪些工具、哪些流程、哪些技术和哪些角色。
- `ai-dev-team mode` 是 `ai-my-pm` 里的大任务执行模式，不是默认入口。
- 没有用户明确授权“用多个 agent / 并行 agent / subagent”时，只能把多角色当作思考和检查框架，不主动 spawn subagent。
- 一旦启用 subagent，必须先明确每个 agent 的目标、读写边界和验证方式。
- G1-G7 Gate 只用于 L3/L4、用户明确要求流程化推进，或任务需要调研、计划、项目 handoff、验收和归档记录。
- L1/L2 默认不进入 Gate；能在当前 Chat 直接完成的，不为了流程而制造流程。

## PM 总控职责

- 读取 `config/entry.json`、`config/profile.json`、`runtime/current.json`，按任务选择项目和 scene JSON。
- 判断任务等级：L1 / L2 / L3 / L4。
- 判断需求应该落在哪些项目、哪些端、哪些服务、哪些模块。
- 判断需要读取哪些 `config/projects/*.json`、`config/scenes/*.json`、`docs/repos/*.md`、`docs/scenes/*.md`、rules 和 skills。
- 判断应该采用哪些技术方案、现有封装、项目规范和验证命令。
- 判断是否需要 Notion、Figma、Playwright、Xcode、BFF 调试或项目专属 skill。
- 判断是否需要使用 superpowers 执行纪律，例如澄清、写计划、调试、验证或 review。
- 判断使用单 agent、角色化 checklist、用户授权后的 Codex subagent，还是 G1-G7 Gate。
- 维护结果沉淀：必要时更新 `runtime/current.json`、`runtime/tasks/<task-id>.json`、学习记录、画像候选、项目说明或 Notion。

## Notion 项目地图

`ai-my-pm` 可以把 Notion 作为项目路由来源，但 Notion 不是唯一事实源。

- 项目关系优先来自本地 `config/projects/index.json`、命中的项目 JSON 和 scene JSON。
- DHB/HXB 相关需求、跨仓需求、项目归属不明确时，可以把 Notion `DHB 项目地图` 作为外部补充资料。
- 优先用项目地图确认项目清单、核心项目详情、术语约定和项目关系。
- 本地 `docs/repos/*.md`、代码事实和 Notion 不一致时，先说明差异，再以当前代码和用户确认结果为准。

## 默认分诊流程

当用户只描述需求时，按以下顺序自动判断：

1. 需求类型：页面 / 接口 / 联调 / 原生容器 / 数据 / 配置 / 重构 / 排障 / 发布。
2. 影响范围：单仓 / 跨仓 / 跨端 / 高风险模块。
3. 相关项目：从 `config/projects/index.json`、命中的项目 JSON、`config/scenes/index.json`、Notion 项目地图和当前任务上下文推断。
4. 技术路线：优先采用项目现有技术栈、封装、目录结构和业务约定。
5. 工具选择：按需使用 Notion、Figma、Playwright、Xcode、BFF 调试、项目 skill。
6. 执行纪律：按 superpowers 选择表决定是否加载对应 skill。
7. 执行模式：L1 单 agent；L2 PM checklist；L2/L3 在用户授权后可用同一 Chat 子 Agent；L3/L4 按需启用 G1-G7 Gate；只有用户明确授权才启用 Codex subagent。
8. 验证方式：选择最小但有意义的构建、测试、lint、浏览器、模拟器或接口验证。
9. 沉淀位置：判断是否需要更新 `runtime/current.json`、`runtime/tasks/<task-id>.json`、`docs/repos/*.md`、学习记录、画像候选或 Notion。
10. 如果 L3/L4 需要明确 intake、discovery、plan、handoff、acceptance 或 archive，则进入 G1-G7 Gate。

## superpowers 选择表

`superpowers` 是执行纪律，不是项目上下文源。`ai-my-pm` 负责自动判断是否使用：

| 触发情况 | 使用的 superpower |
| --- | --- |
| 需求目标、边界、验收标准不清楚 | `superpowers:brainstorming` |
| 任务需要 2 步以上实现、跨文件或需要先拆方案 | `superpowers:writing-plans` |
| 开始实现功能或修 bug，适合先定义验证或测试 | `superpowers:test-driven-development` |
| 出现 bug、构建失败、测试失败、行为异常或原因不明 | `superpowers:systematic-debugging` |
| 准备声明完成、修复、可用或测试通过之前 | `superpowers:verification-before-completion` |
| 较大改动完成、涉及共享模块、跨仓链路或高风险行为 | `superpowers:requesting-code-review` |
| 收到 review 意见并准备修改 | `superpowers:receiving-code-review` |

默认规则：

- L1 小任务通常只需要 `verification-before-completion`。
- L2 中任务通常使用 `brainstorming` 或 `writing-plans`，完成前使用 `verification-before-completion`。
- L3/L4 大任务通常使用 `brainstorming`、`writing-plans`、`verification-before-completion` 和 `requesting-code-review`。
- 只有遇到明确 bug 或失败时才使用 `systematic-debugging`。
- 不要为了形式加载所有 superpowers；按任务风险选择最小必要集合。

## 任务等级

### L1 小任务

- 单文件、小样式、小文案、小 bug。
- 影响范围清楚，不涉及跨仓协作。
- Codex 单 agent 直接处理。
- 不启用 `ai-dev-team mode`。
- 不启用 G1-G7 Gate。
- 完成前跑最小验证。

### L2 中任务

- 一个页面、一个接口、一个局部联调链路。
- 需要方案，但不需要多个 worker 同时改代码。
- 用 Architect 视角先拆方案，Codex 单 worker 实现，Reviewer 视角做自审。
- 默认不启用 G1-G7 Gate，除非用户明确要求或后续发现影响范围扩大到 L3/L4。

### L3 大任务

- 跨仓、跨端、跨业务域需求。
- 例如管理端移动 H5 + BFF + iOS 原生 + 小程序。
- 先读 entry/profile/current/task JSON、相关项目 JSON 和 scene JSON。
- 需要需求调研、Figma、项目 handoff、验收跟踪时启用 G1-G7 Gate。
- 进入 `ai-dev-team mode`，按角色拆分。
- 如果用户授权并行，才使用 Codex subagent。
- 每个 worker 必须有明确写入范围。

### L4 高风险任务

- 认证、支付、权限、库存、数据迁移、发布脚本、跨仓重构。
- 必须先写方案或任务计划。
- 默认只允许 Explorer 做只读搜索。
- Worker 开始写代码前必须明确回滚、验证和 review 方式。
- Reviewer 必须对照需求、diff 和验证结果审查。
- 通常启用 G1-G7 Gate。

## G1-G7 Gate

G1-G7 是 `ai-my-pm` 内部的大任务记录流程。

```text
G1 Intent / Intake
-> G2 Discovery
-> G3 Plan / Product UI
-> G4 Development
-> G5 Integration
-> G6 Acceptance
-> G7 Run / Package Archive
```

### Gate 记录位置

活动任务记录在：

```text
runtime/current.json
runtime/tasks/<task-id>.json
config/tasks/gates.json
```

`docs/templates/*.md` 是可选的人类可读模板。当前状态以 JSON 为准。

### G1 Intent / Intake

- 理解用户请求。
- 分类任务类型：bug、feature、refactor、integration、research、design、release。
- 识别可能项目、场景、skills、rules 和未知项。
- 判断任务是否能留在当前 Chat，还是需要 Gate。

### G2 Discovery

- 先读选中的 project/scene JSON。
- 只在需要时读取源码、rules、Figma、Notion、浏览器证据或历史文档。
- Bug 记录复现、现象、预期、疑似模块和证据。
- Feature 记录用户、入口、流程、状态、权限、数据来源和非目标。

### G3 Plan / Product UI

- 输出简洁的技术方案、产品/UI 决策或调研结论。
- 如果缺产品或 UI 且任务需要，先补原型/设计/决策记录，再开发。
- 高风险或多项目开发前需要用户确认。

### G4 Development

- 只执行选中的项目工作。
- 每个项目要有明确写入范围、已加载规则、已加载 skill 和验证预期。
- superpowers 按触发条件作为执行纪律使用。

### G5 Integration

- 记录跨项目运行方式、依赖顺序、本地链接、包版本、代理/环境切换和 BFF/前端/原生协作。
- 不默认扩展到 scene 中所有项目；集成集合保持最小。

### G6 Acceptance

- 对照需求、方案、UI/Figma、API/数据契约和改动文件验收。
- 记录验证命令和未验证区域。
- 如果验收失败，创建返工记录并回到对应项目或 Gate。

### G7 Run / Package Archive

- 记录如何调试/运行。
- 记录如何和选中项目联调。
- 记录测试/预发/正式打包方式。
- 记录最终验证、已知缺口和交接说明。

## 角色定义

### Architect

- 负责需求理解、技术方案、仓库边界、风险识别。
- 默认只读，不直接改代码。

### Explorer

- 负责搜索代码、阅读 Notion / Figma / 文档、梳理字段口径。
- 只读，不改文件。

### Frontend Engineer

- 负责 React、Taro、H5、小程序、样式、页面交互。
- 常见仓库：`dhbfront-manager-mobile`、`DHB_PACKAGES`、`dhbfront-cash-mini`、`dhb-mobile-index`、`customize-mini-program`。

### BFF Engineer

- 负责 Egg.js、接口、字段适配、缓存、数据库、Swagger。
- 常见仓库：`bff-goods`、`bff-warehouse`、`bff-order`、`bff-user`、`egg-business`。

### iOS Engineer

- 负责 Objective-C / Swift、WebView、JSBridge、原生容器对接。
- 常见仓库：`/Users/xj/Documents/ios/DHB`。

### QA Engineer

- 负责测试点、构建命令、回归路径、浏览器或模拟器验证。
- 默认可读写测试文件；是否改业务代码必须另行说明。

### Reviewer

- 负责代码审查、风险判断、缺失验证和遗留问题。
- 默认只读，不直接重写实现。

## 写入边界

- 同一文件同一时间只能归一个 worker 修改。
- Explorer 和 Reviewer 默认禁止写文件。
- 跨仓任务必须按仓库声明 owner。
- 修改 shared library、基础框架、权限、支付、库存等高风险模块前必须先说明影响范围。
- 不得为了并行而拆分强耦合任务；强耦合任务由主 agent 顺序推进。

## 输出要求

启用 `ai-my-pm` 时，最终回复按任务复杂度包含：

- 需求理解：本次要解决什么
- 任务等级：L1 / L2 / L3 / L4
- 项目与技术判断：涉及哪些项目、模块、技术路线
- 工具与流程判断：使用哪些工具、是否需要 Notion / Figma / Playwright / Xcode / BFF 调试 / superpowers / Gate
- 执行模式：单 agent / PM checklist / ai-dev-team mode / Codex subagent / G1-G7 Gate
- 使用角色：哪些角色实际参与，未启用角色时可省略
- 写入范围：改了哪些仓库和文件
- 验证结果：跑了什么命令，结果如何
- 遗留风险：没有验证或需要人工确认的部分
