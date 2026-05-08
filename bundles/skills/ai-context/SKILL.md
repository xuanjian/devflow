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

- Project index: `config/projects/<project-id>.json`
- Scene index: `config/scenes/<scene-id>.json`
- Skill catalog: `config/skills/skills.json`
- Rule catalog: `config/rules/rules.json`
- Gate catalog: `config/tasks/gates.json`

Project JSON owns project relationships:

- Project doc path.
- Project skills.
- Project scenes.
- Project rules.

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
- Keep original Markdown/rule/skill files; do not delete them to reduce context.
- Deprecate `runtime/current-work.md`; current state belongs in `runtime/current.json` plus task JSON.
