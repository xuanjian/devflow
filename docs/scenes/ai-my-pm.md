# Scene: ai-my-pm

## 适用场景

- 用户只说“我要做什么需求”但没有指定项目、工具、流程或技术方案。
- 任何需要从需求反推项目、技术栈、工具、角色、流程和验证方式的开发任务。
- 用户明确提到 `ai-my-pm`、AI PM、项目调度、任务轻重判断、工具选择、技能选择或多角色分工。
- 用户明确提到 `ai-dev-team`、多 Agent、角色分工、Architect / Frontend / BFF / iOS / QA / Reviewer，此时进入 `ai-dev-team mode`。
- 任务涉及多个仓库、多个端或多个技术域，例如 H5 + BFF + iOS + 小程序。
- 需要决定是否使用 OpenSpec、Notion、Figma、Playwright、Xcode、BFF 调试或项目专属 skill。
- 任务风险较高，需要先拆方案、再分配写入范围、最后独立 review。
- 需要并行搜索资料、梳理字段口径、比对 Notion / Figma / 代码实现。
- Jira 任务只有一句话，需要先调研 PC、参考 App、补需求、画 Figma，或需要从主 PM Chat 交接到具体项目 Chat。

## 当前策略

- 默认使用 Codex 原生能力，不安装、不依赖外部 harness。
- 只有用户明确要求评估或安装外部 harness 时，才处理外部执行后端。
- 用户只需要描述需求；`ai-my-pm` 默认负责自动判断怎么实施、用哪些项目、哪些工具、哪些流程、哪些技术和哪些角色。
- `ai-my-pm` 是总控入口，先做任务分级、上下文读取、工具选择和执行模式判断。
- `ai-dev-team mode` 是 `ai-my-pm` 里的大任务执行模式，不是默认入口。
- 没有用户明确授权“用多个 agent / 并行 agent / subagent”时，Codex 只能把 `ai-dev-team mode` 当作角色化思考框架，不主动 spawn subagent。
- 一旦启用 subagent，必须先明确每个 agent 的目标、读写边界和验证方式。
- 如果当前 Chat 能通过子 Agent 承载调研、走查、review 或分项目执行，优先用同一聊天框内的子 Agent；只有单 Chat 上下文或写入协作承载不了时，才升级到 `xuanjian-symphony` 的跨聊天框 handoff。

## PM 总控职责

- 恢复 XUANJIAN 的长期画像和当前工作状态。
- 判断任务等级：L1 / L2 / L3 / L4。
- 判断需要读取哪些 `docs/repos/*.md`、`docs/scenes/*.md`、registry 和项目入口。
- 判断需求应该落在哪些项目、哪些端、哪些服务、哪些模块。
- 判断应该采用哪些技术方案、现有封装、项目规范和验证命令。
- 判断是否需要 OpenSpec、Notion、Figma、Playwright、Xcode、BFF 调试或项目专属 skill。
- 判断是否需要使用 superpowers 执行纪律，例如澄清、写计划、调试、验证或 review。
- DHB/HXB 相关需求需要项目路由时，优先把 Notion `DHB 项目地图` 作为项目关系来源之一。
- 判断使用单 agent、角色化 checklist，还是用户授权后的 Codex subagent。
- 维护结果沉淀：必要时更新 `runtime/current-work.md`、学习记录、画像候选、项目说明或 Notion。
- 当任务被判断为 L3/L4，且需要跨聊天框交接、需求调研、Figma 设计或 Design QA 时，读取 `docs/scenes/xuanjian-symphony.md`，并按 G0-G5 Gate 把任务产物写入 `runtime/tasks/<ticket-key>/`。

## Notion 项目地图

`ai-my-pm` 可以把 Notion 作为项目路由来源，但 Notion 不是唯一事实源。使用规则：

- 项目地图注册在 `registry/notion-sources.json`。
- DHB/HXB 相关需求、跨仓需求、项目归属不明确时，读取 `dhbProjectMap`。
- 优先用项目地图确认项目清单、核心项目详情、术语约定和项目关系。
- 本地 `docs/repos/*.md`、代码事实和 Notion 不一致时，先说明差异，再以当前代码和用户确认结果为准。

## 默认分诊流程

当用户只描述需求时，按以下顺序自动判断：

1. 需求类型：页面 / 接口 / 联调 / 原生容器 / 数据 / 配置 / 重构 / 排障。
2. 影响范围：单仓 / 跨仓 / 跨端 / 高风险模块。
3. 相关项目：从 `docs/repos/*.md`、`registry/repos.json`、`registry/repo-tools.json`、`registry/notion-sources.json`、Notion 项目地图和当前工作上下文推断。
4. 技术路线：优先采用项目现有技术栈、封装、目录结构和业务约定。
5. 工具选择：按需使用 Notion、Figma、OpenSpec、Playwright、Xcode、BFF 调试、项目 skill。
6. 执行纪律：按下方 superpowers 选择表决定是否加载对应 skill。
7. 执行模式：L1 单 agent；L2 PM checklist；L2/L3 在用户授权后可用同一 Chat 子 Agent；L3/L4 才考虑 `xuanjian-symphony` 跨聊天框 handoff；只有用户明确授权才启用 Codex subagent。
8. 验证方式：选择最小但有意义的构建、测试、lint、浏览器、模拟器或接口验证。
9. 沉淀位置：判断是否需要更新 `runtime/current-work.md`、`docs/repos/*.md`、学习记录、画像候选或 Notion。
10. 如果是 L3/L4 且同一 Chat + 子 Agent 也承载不了，按 `xuanjian-symphony` 生成 `runtime/tasks/<ticket-key>/04-<project>-handoff.md`，再交给项目执行 Chat；L1/L2 默认不启用该流程。

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

适用：

- 单文件、小样式、小文案、小 bug。
- 影响范围清楚，不涉及跨仓协作。

处理方式：

- Codex 单 agent 直接处理。
- 不启用 `ai-dev-team mode`。
- 不启用 `xuanjian-symphony`。
- 完成前跑最小验证。

### L2 中任务

适用：

- 一个页面、一个接口、一个局部联调链路。
- 需要方案，但不需要多个 worker 同时改代码。

处理方式：

- 用 Architect 视角先拆方案。
- Codex 单 worker 实现。
- Reviewer 视角做自审。
- 需要时写 OpenSpec change。
- 默认不启用 `xuanjian-symphony`，除非用户明确要求或后续发现影响范围扩大到 L3/L4。

### L3 大任务

适用：

- 跨仓、跨端、跨业务域需求。
- 例如管理端移动 H5 + BFF + iOS 原生 + 小程序。

处理方式：

- 先读 `docs/person/profile.md`、`runtime/current-work.md`、相关 `docs/repos/*.md` 和 scene。
- 如果需要需求调研、Figma 或 Design QA，先判断是否能在同一 Chat 内用子 Agent 完成；不能承载时再启用 `xuanjian-symphony`。
- 需要时写 OpenSpec proposal / design / tasks。
- 进入 `ai-dev-team mode`，按角色拆分。
- 如果用户授权并行，才使用 Codex subagent。
- 每个 worker 必须有明确写入范围。

### L4 高风险任务

适用：

- 认证、支付、权限、库存、数据迁移、发布脚本、跨仓重构。

处理方式：

- 必须先写方案或 OpenSpec。
- 默认只允许 Explorer 做只读搜索。
- Worker 开始写代码前必须明确回滚、验证和 review 方式。
- Reviewer 必须对照需求、diff 和验证结果审查。

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
- 工具与流程判断：使用哪些工具、是否需要 OpenSpec / Notion / Figma / Playwright / Xcode / BFF 调试 / superpowers
- 执行模式：单 agent / PM checklist / ai-dev-team mode / Codex subagent
- 使用角色：哪些角色实际参与，未启用角色时可省略
- 写入范围：改了哪些仓库和文件
- 验证结果：跑了什么命令，结果如何
- 遗留风险：没有验证或需要人工确认的部分
