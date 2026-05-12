# ai-context-lite

`ai-context-lite` 是一个给 AI 编程工具使用的本地上下文工作台。它的目标不是把所有资料一次性塞进聊天窗口，而是把项目、场景、技能、规则和任务状态做成可索引的配置，让 AI 按需读取上下文。

这个仓库是刚安装状态：不包含个人项目、公司规则、历史任务或个人画像。安装后通过 `ai-context-init` 引导用户在本机生成自己的配置。

## 这个工具有什么用

- 减少聊天窗口上下文：AI 先读 JSON 索引，只在需要时加载项目文档、规则或 skill。
- 管理多个项目：把本机多个项目登记成项目卡片，并记录项目路径、说明、规则、技能和场景关系。
- 管理工作场景：把“单项目修改”“前后端联调”“发布打包”“文档整理”等流程抽成场景。
- 管理 skill 和 rule：把可复用能力和项目规范挂到指定项目或场景上，避免每次手动解释。
- 查看任务进度：任务可以记录 G1-G7 阶段，面板里能直观看到当前进度。
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
git clone <repo-url>
cd ai-context-lite
npm install
node scripts/install-ai-context.mjs validate
node scripts/install-ai-context.mjs install
```

`install` 会安装两个核心 skill：

- `ai-context`：维护 ai-context 本身、检查配置、路由项目/场景/规则/skill。
- `ai-context-init`：首次初始化，引导用户把个人画像、项目清单、场景、skill、rule 整理成配置。

默认会尝试创建这些链接：

- `~/.agents/skills/ai-context`
- `~/.agents/skills/ai-context-init`
- `~/.codex/skills/ai-context`
- `~/.codex/skills/ai-context-init`
- `~/.claude/skills/ai-context`
- `~/.claude/skills/ai-context-init`

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

面板或 AI action 里的“新增项目”只需要用户提供项目路径，例如：

```text
/path/to/your/project
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

场景用于描述一类工作流。最少需要：

- 场景名称
- 场景用途
- 要挂载哪些项目

生成后会写入：

- `config/scenes/<scene-id>.json`
- `config/scenes/index.json`
- 相关项目的 `scenes` 关系

## 添加 skill

skill 是 AI 可复用能力。最少需要：

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
node scripts/install-ai-context.mjs validate
npm test
npm run build
```

也可以在面板的“检查”页查看是否有失败项。

## 常用命令

```bash
# 查看安装状态
node scripts/install-ai-context.mjs check

# 验证配置和关系
node scripts/install-ai-context.mjs validate

# 安装核心 skill
node scripts/install-ai-context.mjs install

# 卸载核心 skill 链接
node scripts/install-ai-context.mjs uninstall

# 本地开发面板
npm run dev

# 构建面板
npm run build

# 运行测试
npm test
```

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

1. 克隆仓库。
2. 执行安装脚本。
3. 启动面板。
4. 让 AI 执行 `ai-context-init`。
5. 把第一个项目加进来。
6. 根据真实工作流创建场景。
7. 按项目或场景挂 skill 和 rule。
8. 用“检查”页确认没有 JSON 或关系错误。
