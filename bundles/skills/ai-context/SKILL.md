---
name: ai-context
description: Use when entering, installing, validating, or modifying the ai-context project; also use when routing a task through project/scene/rule/skill JSON indexes or advancing G1-G7 task flow.
---

# ai-context

## Purpose

This skill is the single AI entrypoint for `/Users/xj/Documents/ai-context`.

It keeps AI context loading small and stable:

- Read JSON indexes first.
- Select the project and scene from JSON.
- Load Markdown, rules, or other skills only when the selected JSON says they are needed.
- Store active work in `runtime/current.json` and `runtime/tasks/<task-id>.json`.

## First Files To Read

1. `/Users/xj/Documents/ai-context/config/entry.json`
2. `/Users/xj/Documents/ai-context/config/profile.json`
3. `/Users/xj/Documents/ai-context/runtime/current.json`
4. Active task file from `runtime/current.json`

Do not read every file under `docs/repos/`, `docs/scenes/`, `bundles/rules/`, or `bundles/skills/` by default.

## Routing Model

- Project candidate index: `config/projects/index.json`
- Project detail index: `config/projects/<project-id>.json`
- Scene candidate index: `config/scenes/index.json`
- Scene detail index: `config/scenes/<scene-id>.json`
- Skill catalog: `config/skills/skills.json`
- Rule catalog: `config/rules/rules.json` (`applyMode`, `globs`, `whenToRead` decide when a rule applies)
- Gate catalog: `config/tasks/gates.json`

Routing order:

1. Read project and scene indexes as candidate lists.
2. Select the smallest matching project and scene set.
3. Read only those detail JSON files.
4. Load source Markdown, rules, or skills only when the selected detail JSON requires them.
5. When a selected scene has `rules`, resolve those ids through `config/rules/rules.json` and load only the matching `scene-on-demand` rule sources when the task needs scene-level guidance.

Project JSON owns project relationships:

- Project doc path.
- Project skills.
- Project scenes.
- Project rules.

Scene JSON owns scene relationships:

- Scene projects.
- Scene operation guide.
- Scene rules for cross-project behavior.

Skill JSON does not list mounted projects. Avoid maintaining reverse project relationships in skill files.

## Task Flow

Use G1-G7:

- G1 Intent / Intake
- G2 Discovery
- G3 Plan / Product UI
- G4 Development
- G5 Integration
- G6 Acceptance
- G7 Run / Package Archive

G7 must record:

- How to debug/run.
- How to integrate with other selected projects.
- How to package test/pre/prod.
- What was verified.
- Archive notes and known gaps.

## Commands

Use the install script:

```bash
node scripts/install-ai-context.mjs check
node scripts/install-ai-context.mjs validate
node scripts/install-ai-context.mjs install
node scripts/install-ai-context.mjs uninstall
node scripts/install-ai-context.mjs sync-projects
```

## Write Rules

- Prefer updating JSON indexes through scripts.
- If manually editing JSON, run `node scripts/install-ai-context.mjs validate`.
- Keep active rule files as `.md` under `bundles/rules/**`; `.mdc` is only for generated Cursor entrypoints or archived reference material.
- Keep original Markdown/rule/skill knowledge by moving long or old content to `docs/reference/**`; do not delete it just to reduce context.
- Deprecate `runtime/current-work.md`; current state belongs in `runtime/current.json` plus task JSON.
