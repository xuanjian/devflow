---
name: ai-context
description: Use when entering a repository that follows the ai-context-lite layout, installing the skill entry, or routing a task through the JSON indexes.
---

# ai-context

## Purpose

Use this skill to keep AI context loading small and predictable.

Start with JSON indexes, then load only the project, task, rule, or document that the current request actually needs.

## Read First

1. `config/entry.json`
2. `runtime/current.json`
3. `config/projects/index.json`
4. The matched project JSON, if one exists

Do not assume user profile files, private task boards, company-specific docs, or machine-specific paths exist.

## Privacy Rule

Keep this repository portable. Do not add personal identity, local absolute paths, private project names, credentials, issue links, or workspace-specific URLs.

## Commands

```bash
node bin/ai-context-lite.mjs doctor
node bin/ai-context-lite.mjs check
node bin/ai-context-lite.mjs install
node bin/ai-context-lite.mjs uninstall
```
