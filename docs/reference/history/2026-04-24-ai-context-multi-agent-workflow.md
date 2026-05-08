# ai-context 多工具与多 Agent 协作体系说明

> 这份文档用于说明 XUANJIAN 当前 `ai-context` 项目的作用、它和 superpowers / OpenSpec / ai-my-pm 的关系，以及后续如果评估外部多 agent harness，应该如何纳入而不破坏现有上下文体系。

## 一句话结论

`ai-context` 是中心上下文仓库，负责保存“人、项目、场景、规则、技能”的长期源文件；Codex、Cursor、Claude Code 等工具只应该消费它生成出来的薄入口。

`ai-my-pm` 已经作为 scene + skill 纳入 `ai-context`；它是 XUANJIAN 的个人 AI PM 总控。用户只需要描述要做什么需求，`ai-my-pm` 默认自动判断怎么实施、用哪些项目、哪些工具、哪些流程、哪些技术和哪些角色。需要多角色研发流程时，再进入其中的 `ai-dev-team mode`。`oh-my-openagent` / `oh-my-codex` 只作为未来可评估的外部 harness，不替代 `ai-context`。

## 当前已经落地的部分

当前仓库路径：

```text
/Users/xj/Documents/ai-context
```

当前已有结构：

```text
ai-context/
├── docs/person/       # 个人长期画像入口
├── runtime/      # 当前工作上下文入口
├── docs/repos/        # 单仓库说明
├── docs/scenes/       # 高频工作链路
├── registry/     # repos / scenes / bundles / Notion sources 注册表
├── bundles/      # rules / skills 源文件
├── scripts/      # 生成和同步脚本
└── docs/         # 方案和说明文档
```

当前核心生成脚本：

```bash
node /Users/xj/Documents/ai-context/scripts/generate-adapters.mjs
```

这个脚本当前会做这些事情：

- 扫描 `/Users/xj/Documents/frontend`、`/Users/xj/Documents/ios`、`/Users/xj/Documents/node`、`/Users/xj/Documents/node/plugin`、`/Users/xj/Documents/ComfyUI` 下的项目。
- 根据 `OVERRIDES` 和项目目录生成 `registry/repos.json`。
- 根据各仓库挂载的 shared rules / shared skills 生成 `registry/bundles.json`。
- 生成 `docs/scene-repo-bundle-overview.md`。
- 给各业务仓库写入 `AGENTS.md`、`CLAUDE.md`、`.cursor/rules/00-ai-context.mdc`。
- 将集中维护的 rules / skills 以 symlink 的方式挂到业务仓库里。
- 更新各仓库本地 `.git/info/exclude`，避免个人 AI 配置误提交。

## 分层模型

建议把当前已落地的系统理解成 5 层，执行扩展和候选外部 harness 单独放在下一节。

```text
第 1 层：长期身份
  ai-context/docs/person/profile.md
  ai-context/docs/person/learning-log.md
  ai-context/docs/person/profile-candidates.md

第 2 层：当前阶段
  ai-context/runtime/current-work.md

第 3 层：中心上下文
  ai-context/person
  ai-context/runtime
  ai-context/repos
  ai-context/scenes
  ai-context/bundles

第 4 层：项目入口
  AGENTS.md
  CLAUDE.md
  .cursor/rules
  .agents/skills
  .ai-configs

第 5 层：执行纪律
  superpowers
  OpenSpec
```

核心原则：

- `ai-context` 管“上下文源文件”。
- 长期画像通过学习记录、画像候选和稳定画像三层自动增长。
- Notion `DHB 项目地图` 是 `ai-my-pm` 做 DHB/HXB 项目路由时的上游项目关系来源。
- `superpowers` 管“做事流程和纪律”。
- `OpenSpec` 管“需求、变更和验收标准”。
- `ai-my-pm` 是当前已落地的个人 AI PM 总控；`ai-dev-team mode` 是它里面的大任务多角色执行模式。

## 执行扩展与候选 harness

以下内容不是新的上下文源，只是执行方式或角色方法：

```text
ai-my-pm
  已在 ai-context 中落地为 scene + skill，作为个人 AI PM 总控
  用户只描述需求时，自动判断实施方式、项目、工具、流程、技术和角色

ai-dev-team mode
  ai-my-pm 里的大任务多角色执行模式

Codex
  当前主要 coding agent client，也可作为多 agent / subagent 执行层

oh-my-openagent
  可评估的多 agent harness，需要先确认是否适合接入当前 Codex 主流程

oh-my-codex
  暂不接入；只作为未来候选外部 harness
```

执行扩展的接入原则：

- 不把执行工具当成新的上下文源。
- 不要求所有项目默认启用外部 harness。
- 先让执行工具读取 `ai-context` 生成的入口。
- 用户只需要描述需求，不需要手动指定项目、工具、角色、流程或 skill。
- DHB/HXB 项目归属不清楚时，按 `registry/notion-sources.json` 读取 Notion `DHB 项目地图`。
- 只有当任务规模足够大、写入边界清楚、验证方式明确时，才启用多 agent 执行。
- 当前优先使用自建 `ai-my-pm` scene / skill；需要多角色时进入 `ai-dev-team mode`；用户授权后才使用 Codex subagent；不安装 `oh-my-codex`。

## 长期画像自动增长

XUANJIAN 的长期画像应该随着项目开发和项目中学到的知识增长，但不能把所有项目细节直接写进 `ai-context/docs/person/profile.md`。建议采用四层沉淀：

```text
项目事实
  runtime/current-work.md / docs/repos/*.md / OpenSpec / Notion / 项目代码

学习记录
  ai-context/docs/person/learning-log.md

画像候选
  ai-context/docs/person/profile-candidates.md

长期画像
  ai-context/docs/person/profile.md
```

AI 可以自动写入 `learning-log.md` 和 `profile-candidates.md`。当用户明确说“同步长期画像”“把这个记到长期画像”“以后都按这个来”，或候选已满足稳定、通用、有用三项标准时，可以自动更新 `ai-context/docs/person/profile.md`。

禁止直接晋升到长期画像的内容包括：单次 bug 细节、临时分支状态、单个接口字段口径、临时工作重点、尚未验证的新工具偏好、AI 自己推断但缺少项目证据的信息。

## 这些工具分别解决什么问题

### ai-context

作用：

- 统一管理个人画像、当前工作、项目说明、跨仓场景、rules 和 skills。
- 避免不同项目、不同 AI 工具各自维护一套重复说明。
- 通过生成器把中心内容分发到项目入口。

适合放：

- 长期画像。
- 当前工作状态。
- 项目地图。
- 单仓库说明。
- 跨仓链路。
- 可复用 rules / skills。
- 工具适配规则。

不适合放：

- 单次聊天临时内容。
- 还没有确认的需求猜测。
- 应该随业务代码一起评审的功能规格。

### superpowers

作用：

- 给单次任务提供执行纪律。
- 典型流程包括 brainstorming、writing-plans、test-driven-development、systematic-debugging、verification-before-completion、requesting-code-review。

适合解决：

- 什么时候先问清楚需求。
- 什么时候必须写计划。
- 什么时候先验证再宣称完成。
- bug 修复时如何避免直接猜原因。

`ai-my-pm` 自动选择 superpowers：

```text
需求目标、边界、验收标准不清楚：
  superpowers:brainstorming

需要 2 步以上实现、跨文件或先拆方案：
  superpowers:writing-plans

开始实现功能或修 bug，适合先定义验证或测试：
  superpowers:test-driven-development

出现 bug、构建失败、测试失败、行为异常或原因不明：
  superpowers:systematic-debugging

准备声明完成、修复、可用或测试通过之前：
  superpowers:verification-before-completion

较大改动、共享模块、跨仓链路或高风险行为完成后：
  superpowers:requesting-code-review

收到 review 意见并准备修改：
  superpowers:receiving-code-review
```

默认不为了形式加载全部 superpowers，只按任务风险选择最小必要集合。

不适合替代：

- 长期项目上下文。
- 仓库注册表。
- 多工具 skill 分发。
- 功能需求规格。

### OpenSpec

作用：

- 作为 spec-driven development 的规格层。
- 把“要做什么、为什么、验收标准是什么”写到仓库中。
- 适合跨会话、跨 agent、跨工具持续引用。

推荐用法：

```text
业务仓库/
└── openspec/
    ├── specs/
    │   └── stock-inventory/
    │       └── spec.md
    └── changes/
        └── stock-inventory-mobile-rework/
            ├── proposal.md
            ├── design.md
            ├── tasks.md
            └── specs/
```

和 `ai-context` 的区别：

- `ai-context` 解释“这个仓库、这个人、这个链路是什么”。
- `OpenSpec` 解释“这次能力应该变成什么样”。

### Codex

作用：

- 当前主要 coding agent client，负责读取项目入口、执行代码修改、运行验证，并可以在合适任务中使用 subagent / explorer / worker 分工。
- 对这套体系来说，Codex 是当前主执行工具，不是新的上下文源。

建议定位：

- 不把 Codex 当成长期上下文源，长期上下文仍维护在 `ai-context`。
- 让 Codex 读取 `ai-context` 生成的入口。
- 后续可由 `generate-adapters.mjs` 生成或更新 `.codex/AGENTS.md` 等 Codex 入口。

### ai-my-pm skill

已落地文件：

```text
/Users/xj/Documents/ai-context/docs/scenes/ai-my-pm.md
/Users/xj/Documents/ai-context/bundles/skills/ai-my-pm/SKILL.md
```

作用：

- `docs/scenes/ai-my-pm.md` 定义任务分级、上下文读取、工具选择、多角色执行模式、写入规则。
- `bundles/skills/ai-my-pm/SKILL.md` 定义 Codex 里怎么执行这个 PM 总控流程。
- 默认不安装 `oh-my-codex`；需要多 agent 时优先使用 Codex 原生 subagent。

### oh-my-openagent

作用：

- 候选多 agent harness。
- 强调规划、并行 agent、专门角色、验证循环和 session continuity。

建议定位：

- 它是候选执行层，不是源文件管理层。
- 不让它自由决定所有上下文，而是让它消费 `ai-context`、`OpenSpec`、项目入口和明确任务边界。
- 只适合在确认要试用外部多 agent harness 后用于大任务，不适合每个小改动都启用。

### ai-dev-team mode

作用：

- `ai-my-pm` 里的大任务执行模式，用来把 AI agent 当成研发团队角色组织。
- 典型角色包括 Architect、Frontend、Backend、QA、DevOps、Security、Reviewer。

建议映射到你的项目：

```text
Architect
  负责需求理解、跨仓方案、任务拆分。

Frontend Engineer
  负责 dhbfront-manager-mobile、DHB_PACKAGES、dhbfront-cash-mini、dhb-mobile-index。

BFF Engineer
  负责 bff-goods、bff-warehouse、bff-order、bff-user 等 Egg.js 服务。

iOS Engineer
  负责 /Users/xj/Documents/ios/DHB 的 WebView、JSBridge、原生容器对接。

QA Engineer
  负责测试点、构建、回归路径、边界场景。

Reviewer
  负责对照需求、OpenSpec 和 diff 做最终审查。

Explorer
  只读搜索代码、整理资料、查字段口径，不直接改文件。
```

关键规则：

- Explorer 默认只读。
- Reviewer 默认不改文件。
- 同一时间一个文件只允许一个 worker 负责。
- 跨仓任务必须先明确每个 agent 的写入范围。
- 所有 worker 的结果都必须由主 agent 或 Reviewer 复核。

## 推荐的开发流程

### 小任务

适用：

- 单文件修正。
- 文案、样式、小 bug。
- 影响范围明确。

流程：

```text
读取项目入口
-> 读取 ai-context/docs/person/profile.md
-> 读取 ai-context/runtime/current-work.md
-> 单 agent 修改
-> 运行最小验证
-> 总结结果
```

不建议进入 `ai-dev-team mode`。

### 中任务

适用：

- 一个页面。
- 一个接口。
- 一个跨前后端小链路。

流程：

```text
superpowers:brainstorming
-> 明确目标和边界
-> 必要时写 OpenSpec change
-> superpowers:writing-plans
-> Worker 实现
-> verification-before-completion
-> requesting-code-review
```

可以使用 Architect + Worker + Reviewer。

### 大任务

适用：

- 盘点单改造。
- AI 海报 2 期。
- H5 + BFF + iOS + 小程序的跨端需求。

流程：

```text
1. 读取全局上下文
   ai-context/docs/person/profile.md
   ai-context/runtime/current-work.md

2. 读取项目上下文
   ai-context/docs/repos/*.md
   ai-context/docs/scenes/*.md
   registry/repos.json
   registry/bundles.json

3. 梳理需求
   Notion
   Figma
   当前代码
   旧接口
   iOS 原生参考

4. 写规格
   OpenSpec proposal
   OpenSpec design
   OpenSpec tasks
   spec delta

5. 进入 `ai-dev-team mode`
   Architect
   Frontend
   BFF
   iOS
   QA
   Reviewer

6. 分配边界
   每个 agent 一个明确目标
   每个 worker 一个明确写入范围
   Explorer 只读

7. 执行和验证
   前端构建
   BFF 测试或 lint
   浏览器 / iOS 联调
   diff review

8. 沉淀
   更新 runtime/current-work.md
   更新 OpenSpec
   必要时更新 ai-context scenes / bundles
   重新运行 generate-adapters.mjs
```

## 建议新增的配置层

当前 `ai-context` 已经有：

```text
registry/repos.json
registry/scenes.json
registry/bundles.json
```

如果要支持多 AI 软件和多 agent，建议后续新增：

```text
registry/clients.json
registry/repo-tools.json
registry/agent-teams.json
```

### clients.json

描述每个 AI 工具支持什么。

示例：

```json
{
  "codex": {
    "entryFiles": ["AGENTS.md", ".codex/AGENTS.md"],
    "supportsSkills": true,
    "supportsMcp": true,
    "supportsSubagents": true
  },
  "cursor": {
    "entryFiles": [".cursor/rules/00-ai-context.mdc"],
    "supportsSkills": "partial",
    "supportsMcp": true
  },
  "claudeCode": {
    "entryFiles": ["CLAUDE.md"],
    "supportsSkills": true,
    "supportsHooks": true
  },
  "codex": {
    "entryFiles": ["AGENTS.md", ".codex/AGENTS.md"],
    "supportsSkills": true,
    "supportsAgentHarness": true
  }
}
```

### repo-tools.json

描述每个项目能使用哪些本地工具。

示例：

```json
{
  "dhbfront-manager-mobile": {
    "figma": true,
    "notion": true,
    "playwright": true,
    "xcode": false,
    "bffDebug": true,
    "codex": true
  },
  "dhb": {
    "figma": true,
    "notion": true,
    "playwright": false,
    "xcode": true,
    "bffDebug": false,
    "codex": true
  }
}
```

### agent-teams.json

描述不同任务规模下启用哪些 agent。

示例：

```json
{
  "stock-inventory-cross-repo": {
    "roles": [
      {
        "name": "Architect",
        "write": false,
        "reads": ["global", "work", "repos", "scenes", "openspec"]
      },
      {
        "name": "Frontend Engineer",
        "write": true,
        "repos": ["dhbfront-manager-mobile"]
      },
      {
        "name": "BFF Engineer",
        "write": true,
        "repos": ["bff-warehouse"]
      },
      {
        "name": "Reviewer",
        "write": false,
        "reads": ["diff", "openspec", "tests"]
      }
    ]
  }
}
```

## 推荐新增的 scene

可以新增：

```text
docs/scenes/ai-my-pm.md
```

建议内容：

```text
# Scene: ai-my-pm

## 适用场景

- 跨仓需求
- 多端联调
- 大范围重构
- 需要 Architect / Worker / QA / Reviewer 分工

## 默认规则

- 先读全局画像和当前工作。
- 再读本次相关 repo 和 scene。
- 若存在 OpenSpec，以 OpenSpec 为本次需求的目标源。
- Explorer 只读。
- Reviewer 只审查，不直接重写实现。
- Worker 必须声明写入范围。
- 禁止多个 Worker 同时修改同一文件。

## 输出要求

- 每个 Worker 汇报修改文件。
- QA 汇报验证命令和结果。
- Reviewer 汇报风险和遗留问题。
- 主 agent 汇总最终状态。
```

## 后续维护方式

### 新增仓库

1. 确认仓库路径在 `ROOTS` 扫描范围内。
2. 必要时在 `scripts/generate-adapters.mjs` 的 `OVERRIDES` 中补充：
   - `repoKey`
   - `family`
   - `repoType`
   - `summary`
   - `defaultScenes`
   - `tags`
   - `sharedRules`
   - `sharedSkills`
3. 运行：

```bash
node /Users/xj/Documents/ai-context/scripts/generate-adapters.mjs
```

4. 检查：
   - `registry/repos.json`
   - `docs/repos/<repo>.md`
   - 业务仓库 `AGENTS.md`
   - 业务仓库 `CLAUDE.md`
   - 业务仓库 `.cursor/rules/00-ai-context.mdc`

### 新增 skill

1. 在 `bundles/skills/` 下创建源文件或目录。
2. 在对应 repo 的 `sharedSkills` 中挂载。
3. 后续如果支持多工具矩阵，在 skill metadata 中补充：
   - 支持哪些 clients。
   - 需要哪些本地工具。
   - 适用哪些 repo 或 scene。
4. 运行生成器。
5. 检查项目侧 symlink 是否正确。

### 新增 rule

1. 在 `bundles/rules/` 下创建源文件。
2. 在对应 repo 的 `sharedRules` 中挂载。
3. 运行生成器。
4. 检查 Cursor / ai-configs 入口是否同步。

### 新增跨仓场景

1. 在 `docs/scenes/` 下创建场景说明。
2. 更新 `registry/scenes.json`。
3. 在相关 repo 的 `defaultScenes` 中挂载。
4. 运行生成器。
5. 检查 `docs/scene-repo-bundle-overview.md`。

### 评估 Codex 多 agent / 外部 harness

当前已经完成前 4 项基础建设：

```text
已完成：新增 docs/scenes/ai-my-pm.md。
已完成：新增 bundles/skills/ai-my-pm/SKILL.md。
已完成：新增 clients.json / repo-tools.json。
已完成：扩展 generate-adapters.mjs，使其可生成 .codex/AGENTS.md 和 .codex/skills symlink。
未执行：批量运行 generate-adapters.mjs 同步所有业务仓库。
暂不做：安装或接入 oh-my-codex / oh-my-openagent。
```

不要一开始就让 oh-my-codex / oh-my-openagent 对当前 dirty 分支做 full auto。跨仓、多 agent、自动执行必须先有写入边界和验证规则。

## 推荐决策规则

```text
任务小，影响单一：
  用 Codex 单 agent。

任务中等，需要方案但不跨很多仓：
  用 ai-my-pm 选择必要 superpowers + 单 Worker + Reviewer。

任务大，涉及前端 / BFF / iOS：
  用 OpenSpec + ai-my-pm 选择必要 superpowers，并进入 ai-dev-team mode。

需要并行搜索资料：
  开多个 Explorer，只读。

需要真正多 agent 执行：
  先使用 ai-my-pm 判断边界，再进入 ai-dev-team mode；优先使用 Codex subagent；确认 Codex 原生能力不够时，再评估外部 harness。

需要沉淀长期规则：
  更新 ai-context。

需要沉淀本次需求：
  更新 OpenSpec。

需要沉淀当前阶段状态：
  更新 ai-context/runtime/current-work.md。
```

## 当前已落地与后续

已落地：

1. `docs/scenes/ai-my-pm.md`
2. `bundles/skills/ai-my-pm/SKILL.md`
3. `registry/clients.json`
4. `registry/repo-tools.json`
5. `generate-adapters.mjs` 支持 `.codex/AGENTS.md` 和 `.codex/skills`

后续：

- 先在 `ai-context` 项目内试用 ai-my-pm skill
- 确认无误后，再决定是否运行 `generate-adapters.mjs` 批量同步业务仓库
- 暂不安装 `oh-my-codex`

## 参考资料

- oh-my-openagent: https://ohmyopenagent.com/
- oh-my-openagent GitHub: https://github.com/code-yeongyu/oh-my-openagent
- AgentsRoom AI Dev Team: https://agentsroom.dev/ai-dev-team
- OpenSpec: https://openspec.dev/
- 本地 superpowers: `/Users/xj/.codex/superpowers/skills`
