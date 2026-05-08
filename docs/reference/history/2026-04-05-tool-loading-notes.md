# 多工具读取机制笔记

## Codex

- 官方文档：OpenAI Developers - `Custom instructions with AGENTS.md`
- 关键点：
  - Codex 会在每次会话启动时构建 instruction chain
  - 先读全局 `~/.codex/AGENTS.override.md` 或 `~/.codex/AGENTS.md`
  - 再从项目根目录一路向当前目录读取 `AGENTS.override.md` / `AGENTS.md`
  - 越靠近当前目录的文件优先级越高
- 设计含义：
  - 项目根目录必须有薄 `AGENTS.md`
  - 全局长期画像可以继续放在 `/Users/xj/AGENTS.md`，但项目入口要明确把它带出来

## Claude Code

- 官方文档：Anthropic Claude Code Docs
- 关键点：
  - 仓库根目录的 `CLAUDE.md` 是项目级主入口
  - 个人级记忆通常可放在 `~/.claude/CLAUDE.md`
  - 企业或团队设置还可以通过 `.claude/settings.json` / `settings.local.json` 管控权限与行为
- 设计含义：
  - 每个仓库根目录生成薄 `CLAUDE.md`
  - 不把大段项目说明直接堆在 `CLAUDE.md`，而是指向中心上下文仓库

## Cursor

- 官方文档：Cursor docs / Rules
- 关键点：
  - 当前主流入口是 `.cursor/rules/*.mdc`
  - 项目级规则推荐拆成多个 rule 文件，而不是只维护单个大文件
  - `AGENTS.md` 可作为简单替代入口，但 Cursor 更偏向 rules 目录
- 设计含义：
  - 每个项目至少生成 `.cursor/rules/00-ai-context.mdc`
  - 可共享的规则尽量提升到中心上下文仓库，再由项目通过薄 rule 或 symlink 挂载

## 当前落地策略

- 项目根目录统一生成：
  - `AGENTS.md`
  - `CLAUDE.md`
  - `.cursor/rules/00-ai-context.mdc`
- 已存在 `.ai-configs` / `.codex` 的仓库，继续生成兼容入口
- 共享 rules / skills 放到 `/Users/xj/Documents/ai-context/bundles/`
