# ai-context

`ai-context` 是一个给 AI 编程工具使用的本地上下文工作台。它采用 SDD + TDD 的开发模式：用 OpenSpec 承接规格驱动开发，用 superpowers 承接测试驱动和工程执行纪律，再用 ai-context 把项目路由、任务状态、看板、规则和技能索引串起来。

它的目标不是把所有资料一次性塞进聊天窗口，而是把项目、场景、技能、规则、规格和任务状态做成可索引的配置，让 AI 按需读取上下文。

更准确地说，ai-context 是 AI 开发的本地控制面：

- 项目地图：登记项目、技术族、仓库路径、项目说明、项目之间的关系和联动方式。
- 需求路由：用户只说需求时，先判断涉及哪些项目、场景、规则、skill、规格和任务等级。
- 流程编排：把 OpenSpec 的 SDD 规格层、superpowers 的 TDD 执行层和 G1-G7 任务状态接成一条可执行流程。
- 规则治理：把团队规范、BFF/前端/iOS/发布规则和可复用 skill 挂到项目或场景上，避免每次靠聊天重新解释。
- 看板观测：把当前任务、项目关系、OpenSpec 状态、验证结果、阻塞项和 recovery point 展示出来。
- 多工具适配：让 Codex、Claude Code、Cursor、QoderWork、OpenCode、WorkBuddy 等工具读取同一套本地上下文。
- 隐私隔离：公开框架保持空骨架，本机初始化后才生成个人画像、项目资料、任务证据和私有规则。

这个仓库是刚安装状态：不包含个人项目、公司规则、历史任务或个人画像。安装后通过 `ai-context-init` 引导用户在本机生成自己的配置。

## SDD + TDD 模式

ai-context 默认把复杂任务拆成三层协作：

- SDD 规格层：OpenSpec 负责把 PRD、Jira、Notion、Figma、跨项目验收标准沉淀成 proposal、design、tasks 和 spec delta。它回答“这次变化到底要做什么、为什么做、验收口径是什么”。
- TDD 执行层：superpowers 负责 brainstorming、test-driven-development、systematic-debugging、verification-before-completion、code review 等执行纪律。它回答“怎么证明实现是对的、怎么先写测试、怎么排查和验收”。
- ai-context 编排层：ai-context 负责选择项目、项目关系、场景、规则、skill、OpenSpec change 和 G1-G7 任务状态。它回答“当前任务涉及哪些项目、项目之间怎么联动、该读哪些上下文、该走哪条流程、下次窗口从哪里继续”。

这三层不是互相替代：

- 只有 OpenSpec：规格可以沉淀，但它不知道你本机有哪些项目、BFF/前端/iOS/脚本仓库之间怎么联动、该加载哪些规则和 skill，也不会自动维护当前任务看板。
- 只有 superpowers：TDD、调试、验收纪律很强，但长期规格、跨会话任务状态、项目路由和多工具共享上下文不够稳定。
- 加上 ai-context：OpenSpec 的规格产物、superpowers 的执行步骤、项目关系、场景关系、rule/skill 索引、G1-G7 看板状态会被纳入同一个本地控制面。可恢复任务链只是其中一个结果，更重要的是 AI 能自动判断“该读什么、该用什么规范、该走什么流程、该把产物交给谁”。

典型链路是：

1. 用户只说需求。
2. ai-context 判断项目、场景、任务等级，以及是否需要 OpenSpec。
3. L3/L4 或有 PRD/Jira/Notion/Figma 的任务进入 OpenSpec，形成可归档规格。
4. 实现阶段由 superpowers 驱动 TDD、调试、验证和 review。
5. ai-context 把每个阶段的产物写入任务状态，让下一阶段或下一个 AI 工具继续使用。

## 为什么按需加载

ai-context 不默认读取所有 Markdown、规则、skill 和历史任务，而是先读 JSON 索引，再按任务选择上下文。这样做有几个实际收益：

- 上下文更小：先用项目、场景、规则、skill 的摘要做路由，只有命中任务时才读源文档，减少 token 消耗。
- 命中更准：AI 不会同时看到一堆无关项目、旧规则、历史任务，降低把旧信息当成当前事实的概率。
- 隐私边界更清楚：个人画像、公司项目、任务证据、截图和内部链接只在本机初始化后按需进入上下文，不会混进公开框架。
- 跨项目关系更稳定：项目和场景关系写在 JSON 里，AI 可以先判断“这个需求涉及前端、BFF、iOS 还是发布脚本”，再加载对应资料。
- 多工具更容易接力：Codex、Claude Code、Cursor、QoderWork 等工具都读同一套索引和任务状态，不需要每个窗口重复解释项目背景。
- 长任务更容易恢复：G1-G7、OpenSpec change、验证结果、阻塞项和 recovery point 都在任务 JSON 里，下一次可以从明确位置继续。

## 这个工具有什么用

- 建立本地 AI 项目地图：项目、技术族、仓库路径、上下游关系、场景组合和验证入口都可索引。
- 自动做需求路由：用户只说需求时，AI 可以先判断项目、场景、规则、skill、OpenSpec 和任务等级。
- 减少聊天窗口上下文：AI 先读 JSON 索引，只在需要时加载项目文档、规则或 skill。
- 管理多个项目和项目关系：把本机多个项目登记成项目卡片，并记录项目路径、说明、规则、技能、场景关系和跨项目联动方式。
- 管理工作场景：把“单项目修改”“前后端联调”“发布打包”“文档整理”等流程抽成场景。
- 管理 skill 和 rule：把可复用能力和项目规范挂到指定项目或场景上，避免每次手动解释。
- 连接 SDD 和 TDD：OpenSpec 管规格，superpowers 管执行，ai-context 管两者之间的选择、状态和交接。
- 查看任务进度：任务可以记录 G1-G7 阶段、OpenSpec 状态、验证结果和恢复点，面板里能直观看到当前进度。
- 跨工具连续任务：Codex、Claude Code、Cursor 可以读取同一套本地索引和任务状态，用户切换工具时不用重新描述任务或重复粘贴大量文档。
- 支持多个 AI 工具共用：安装脚本会把核心 skill 链接到常见 AI 工具的 skill 目录。

## 当前初始内容

刚克隆后只保留最小骨架：

- 1 个项目：`ai-context`
- 1 个场景：`ai-context-config`
- 2 个核心 skill：`ai-context`、`ai-context-init`
- 空的 rules：`config/rules/rules.json`
- 空的当前任务：`runtime/current.json`

真实项目、个人画像、历史任务、公司规则都需要用户在本机初始化后再生成。

## 安装

```bash
npm install -g @xuanjames/ai-context
ai-context init
```

如果当前目录还没有 `ai-context`，直接运行 `ai-context init` 会自动创建 `./ai-context` 本地工作目录，所以不需要手动 `git clone`。想指定位置可以用：

```bash
ai-context init --dir ~/Documents/ai-context
```

需要启动看板时再进入本地目录安装前端依赖：

```bash
cd ai-context
npm install
npm run dev
```

`ai-context init` 会像 OpenSpec 初始化一样在终端里选择要配置的 AI 工具，可以多选：

- Codex
- Claude Code
- Cursor
- QoderWork
- OpenCode
- WorkBuddy

也可以非交互安装：

```bash
ai-context init --tools codex,claude-code,cursor
```

初始化会安装/检查这些能力：

- `ai-context`：维护 ai-context 本身、检查配置、路由项目/场景/规则/skill。
- `ai-context-init`：首次初始化，引导用户把个人画像、项目清单、场景、skill、rule 整理成配置。
- OpenSpec CLI：L3/L4 或有 PRD/Jira/Notion/Figma 输入的大任务使用的规格层。
- superpowers：开发、调试、TDD、验收等执行纪律层。

如果不希望初始化时自动安装 OpenSpec，可以加：

```bash
ai-context init --skip-openspec
```

完整安装说明见 [docs/install.md](docs/install.md)，项目流程说明见 [docs/project-introduction.md](docs/project-introduction.md)。`scripts/install-ai-context.mjs setup/doctor` 只作为内部脚本和排障入口，不作为日常安装入口。

## 聊天入口

安装后，日常操作不是让用户记一堆终端命令，而是在 AI 聊天框里触发 ai-context：

```text
@ai-context:add /path/to/project
@ai-context:add scene 前后端联调
@ai-context:add skill /path/to/skill
@ai-context:add rule bff/error-handling
@ai-context:task 新增盘点单打印预览
@ai-context:panel
```

这些入口默认走同一个 `ai-context` skill，不是拆成多个常驻 skill。`add`、`task`、`panel` 只是子意图：ai-context 先读 JSON 索引做路由，再按需调用底层 action 或脚本写入项目、场景、skill、rule 和任务状态。

- `@ai-context:add`：新增/更新项目、场景、skill、rule。新增项目时只需要项目路径；系统会扫描 `AGENTS.md`、`CLAUDE.md`、`README.md`、Cursor rules 和项目内 `SKILL.md`。新增场景、skill、rule 时，如果关联项目不能推断，AI 应该询问要挂载到哪些项目。
- `@ai-context:task`：开一个可恢复任务，记录项目、场景、G1-G7 gate、OpenSpec 状态、验证结果和 recovery point。
- `@ai-context:panel`：打开或解释本地看板，看板只展示 JSON 状态，不作为新的事实来源。
- `@ai-context:init`：首次配置本机画像、项目、场景、skill 和 rule。

OpenSpec 仍然是 L3/L4、PRD/Jira/Notion/Figma、跨项目或高风险任务的规格层；ai-context 在任务状态里记录 OpenSpec change/path/status。普通 L1/L2 小改不强制 OpenSpec。

## 启动面板

```bash
npm run dev
```

打开终端输出的本地地址，例如：

```text
http://127.0.0.1:5173/
```

面板里主要有：

- 总览：查看当前项目、场景、技能、规则、任务状态。
- 关系：查看项目、场景、技能、规则之间的关系图。
- 任务：查看当前任务阶段和进度。
- 画像：查看初始化后生成的个人画像文档。
- 检查：查看配置文件、索引关系、skill 链接和面板依赖是否正常。

## 跨工具连续任务

`ai-context` 可以让 Codex、Claude Code、Cursor 等不同 AI 开发工具共享同一套本地上下文索引。用户不用在每个工具里重新解释需求、重新粘贴项目文档、重新说明规则。

它主要通过这些文件保存可恢复的信息：

- `config/projects/*.json`：项目说明、项目路径、项目挂载的场景、skill、rule。
- `config/scenes/*.json`：常见工作场景、跨项目关系和执行说明。
- `config/skills/skills.json`：可复用 AI 能力目录。
- `config/rules/rules.json`：项目或场景规则目录。
- `runtime/current.json`：当前任务指针。
- `runtime/tasks/*.json`：任务阶段、进度、恢复点、验证记录。

典型使用方式：

1. 在 Codex 里开始一个任务，并让 AI 记录到 ai-context。
2. ai-context 写入任务目标、相关项目、场景、规则和当前阶段。
3. 切到 Claude Code 或 Cursor 后，让新工具读取同一个 ai-context。
4. 新工具根据 `runtime/current.json` 和任务 JSON 恢复上下文。
5. 用户只需要说“继续当前任务”，不需要重新塞一堆资料。

如果要让不同工具稳定恢复任务，建议每个任务至少记录：

- 任务目标
- 涉及项目
- 当前阶段
- 已完成内容
- 下一步要做什么
- 关键规则或 skill
- 验证结果和未解决问题

## 首次配置

安装完成后，在 AI 工具里让它执行：

```text
运行 ai-context-init
```

`ai-context-init` 会一步一步询问：

- 你的 AI 协作偏好是什么
- 哪些信息只能保留在本机
- 有哪些项目需要加入
- 是否需要创建常用场景
- 是否有现成的 `SKILL.md`
- 是否有现成规则文件
- 任务要不要按 G1-G7 记录进度

用户可以给很凌乱的信息，AI 应该负责整理成结构化配置，而不是要求用户自己写 JSON。

## 添加项目

聊天框里的 `@ai-context:add` 新增项目只需要用户提供项目路径，例如：

```text
@ai-context:add /path/to/your/project
```

系统会尝试读取项目里的说明文件：

- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `.cursor/rules/*.mdc`
- 项目内的 `SKILL.md`

然后生成：

- `docs/repos/<project-id>.md`
- `config/projects/<project-id>.json`
- `config/projects/index.json`
- 关联到选中的 scene、skill、rule

## 添加场景

场景用于描述一类工作流。可以在聊天框里说：

```text
@ai-context:add scene 前后端联调
```

最少需要：

- 场景名称
- 场景用途
- 要挂载哪些项目

生成后会写入：

- `config/scenes/<scene-id>.json`
- `config/scenes/index.json`
- 相关项目的 `scenes` 关系

## 添加 skill

skill 是 AI 可复用能力。可以在聊天框里说：

```text
@ai-context:add skill /path/to/skill
```

最少需要：

- skill 路径，指向一个包含 `SKILL.md` 的目录
- 要挂载到哪些项目或场景

导入后会复制到：

```text
bundles/skills/<skill-id>/SKILL.md
```

并更新：

- `config/skills/skills.json`
- 相关项目的 `skills` 关系

如果没有现成文件，先让 AI 生成 skill 内容，再导入。

## 添加 rule

rule 是项目或场景的执行规则。可以从已有 `.md` 文件导入，也可以让 AI 根据用途生成。

```text
@ai-context:add rule bff/error-handling
```

建议至少提供：

- rule 名称
- rule 用途
- 适用项目或场景
- 什么时候读取
- 影响哪些文件类型或目录

生成后会写入：

- `bundles/rules/<rule-id>.md`
- `config/rules/rules.json`
- 相关项目或场景的 `rules` 关系

## 验证

每次初始化或修改配置后，建议运行：

```bash
ai-context init --tools codex --skip-openspec
node scripts/install-ai-context.mjs validate
npm test
npm run build
```

也可以在面板的“检查”页查看是否有失败项。

## 重要目录

```text
config/entry.json                 AI 入口和读取策略
config/profile.json               用户画像摘要，刚安装为空
config/projects/index.json        项目索引
config/scenes/index.json          场景索引
config/skills/skills.json         skill 索引
config/rules/rules.json           rule 索引
runtime/current.json              当前任务状态，刚安装为空
bundles/skills/ai-context         核心维护 skill
bundles/skills/ai-context-init    首次初始化 skill
docs/                             初始化后生成项目和场景文档
```

## 隐私说明

这个仓库的公开版本不应该提交：

- 真实公司项目资料
- 私有项目路径
- token、cookie、账号、密钥
- 工单、知识库链接、截图等敏感内容
- 个人长期画像

这些内容应该在用户自己的本机初始化后生成，并按需要加入 `.gitignore` 或保留在私有仓库里。

## 推荐工作流

1. `npm install -g @xuanjames/ai-context`。
2. 运行 `ai-context init`，选择要配置的 AI 工具。
3. 在 AI 聊天框里运行 `@ai-context:init`。
4. 用 `@ai-context:add /path/to/project` 把第一个项目加进来。
5. 根据真实工作流用 `@ai-context:add scene ...` 创建场景。
6. 按项目或场景挂 skill 和 rule。
7. 开始任务时用 `@ai-context:task ...` 写入 `runtime/current.json` / `runtime/tasks/*.json`。
8. 需要观察状态时用 `@ai-context:panel` 或本地 `npm run dev`。
9. 切换到 Codex、Claude Code 或 Cursor 时，让新工具先读取 ai-context 后继续。
10. 用“检查”页确认没有 JSON 或关系错误。
