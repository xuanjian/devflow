# ai-context 统一上下文中心迁移计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用统一的 `ai-context` 目录替代分散在各工具、各仓库中的重复上下文正文，并为所有常用仓库生成薄入口文件。

**Architecture:** 采用“个人画像与当前工作在根目录维护，项目与链路上下文在 `ai-context` 中维护，工具入口由脚本生成”的结构。项目级会话先读项目入口，再回到全局画像和当前工作，最后按场景补充链路信息。

**Tech Stack:** Markdown, JSON, Node.js, symlink-compatible adapter generation

---

## 范围

- 扫描根目录：
  - `/Users/xj/Documents/frontend`
  - `/Users/xj/Documents/ios`
  - `/Users/xj/Documents/node`
  - `/Users/xj/Documents/ComfyUI`
- 仓库级入口：
  - `AGENTS.md`
  - `CLAUDE.md`
  - `.cursor/rules/00-ai-context.mdc`
  - 已存在 `.ai-configs` / `.codex` 时补生成兼容入口

## 分层原则

- `/Users/xj/AGENTS.md`
  - 个人长期画像
- `/Users/xj/WORK_CONTEXT.md`
  - 当前工作上下文
- `/Users/xj/Documents/ai-context`
  - 项目、链路、规则包、生成器
- 各仓库根目录
  - 仅保留薄入口，不维护大段重复正文

## 插件/工具仓库策略

- 不把插件、工具、实验仓库默认拉入 DHB 业务链路
- 这类仓库默认命中 `single-repo-change`
- 只有当用户明确说要联动业务链路时，再扩展到其它 scene

## 兼容策略

- 旧目录 `/Users/xj/Documents/frontend/_dhb-ai-context` 已完成退役
- 旧 skill 入口统一迁移到 `ai-context`，项目侧保留的是新中心目录的入口或 symlink
- 新生成的入口统一指向 `/Users/xj/Documents/ai-context`
