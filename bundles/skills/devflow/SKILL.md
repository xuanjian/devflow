---
name: devflow
description: Use when entering, installing, validating, or modifying DevFlow, or when a request needs DevFlow project/task/rule/skill state.
---

# DevFlow

DevFlow is the local context and task-state workbench. Use it on demand; do not treat it as the default full workflow for every new chat.

## First Decision

Before loading DevFlow data, classify the request:

- `none`: ordinary questions, explanations, or code snippets. Do not read DevFlow unless project context is explicitly needed.
- `resume`: user says continue/current/last task. Read `runtime/current.json`, the active task, Workset, `nextAction`, and `recoveryPoint`.
- `light`: small bug or small change. Use minimal project/context lookup and light tracking only when the work should survive the chat.
- `full`: large, cross-project, high-risk, Jira/Notion/Figma/PRD-backed work. Use full task tracking, G1-G7, and OpenSpec when selected.

Do not start G1-G7 by default.
Do not load all projects, scenes, rules, skills, or task history by default.

## Read Order

Read only what the chosen mode needs:

1. `config/entry.json`
2. `config/profile.json`
3. `runtime/current.json`
4. Active task file from `runtime/current.json`, only for `resume`, task status, or tracked work
5. Project, scene, rule, or skill JSON selected by the task

Do not read home-level compatibility files unless the user asks to inspect or repair those files.

## Routing Sources

- Projects: `config/projects/index.json` -> `config/projects/<project-id>.json`
- Scenes: `config/scenes/index.json` -> `config/scenes/<scene-id>.json`
- Skills: `config/skills/skills.json`
- Rules: `config/rules/rules.json`
- Gates: `config/tasks/gates.json`
- Task state: `runtime/current.json` and `runtime/tasks/*.json`

## Chat Subcommands

These are sub-intent routes of one DevFlow skill.

- `@devflow:add`: add or update a project, scene, skill, or rule.
- `@devflow:del`: delete a project, scene, skill, or rule from DevFlow metadata.
- `@devflow:task`: create, resume, or update a tracked task.
- `@devflow:panel`: open, explain, or validate the local task/project panel.
- `@devflow:init`: first-time onboarding after installation.

Use specialist skills only when the selected route needs them. For example, authoring a new `SKILL.md` should also use `superpowers:writing-skills`.

## `@devflow:add`

Route by object:

- Project: user can provide only a project path. Scan `.ai-configs/project.md`, `AGENTS.md`, `CLAUDE.md`, `claude.md`, `README.md`, `.cursor/rules`, `.ai-configs/rules`, and project-local `SKILL.md` directories. If the project has no `.ai-configs`, explain that DevFlow will create `.ai-configs/project.md` and ask for confirmation before migrating project entry content. Then call `add_project_from_path`.
- Scene: ask for `projectIds` only when the mount target cannot be inferred, then call `add_scene`.
- Skill: ask which `projectIds` or family should mount it when not inferable, then call `add_skill_from_path`. If no `SKILL.md` exists, author it first.
- Rule: ask which `projectIds` and `sceneIds` should receive it when not inferable, then call `add_rule`.

Project docs, project-local skills, and project-local rules stay in the business repository. DevFlow records source paths and relationships.

## `@devflow:del`

Route by object:

- Project -> `delete_project`
- Scene -> `delete_scene`
- Skill -> `delete_skill`
- Rule -> `delete_rule`

Deletion is scoped to DevFlow metadata and managed files. It must not delete the real business repository, external source docs, external skills, or external rule files.

## `@devflow:task`

Create or update a task only when work should survive the current chat.

For small tasks, prefer `light` tracking. For L3/L4, vague product ideas, PRD/Jira/Notion/Figma-backed work, cross-project work, or high-risk work, use `full` tracking and ask Socratic multiple-choice clarification during G1 Intake.

Good clarification prompts:

- "这个任务更像哪一种？1. 修现有流程 2. 新增模块 3. 先做方案验证。"
- "优先目标选哪个？1. 尽快可用 2. 体验完整 3. 后续可扩展。"
- "本轮边界建议选哪个？1. 只做核心闭环 2. 核心加管理配置 3. 先出 PRD/OpenSpec。"

Avoid asking only open-ended questions when the user has not formed the requirement. Provide 2-3 concrete options and let the user choose `1`, `2`, `3`, modify an option, or describe a new direction.

The task route owns:

- Task title and level
- Selected projects/scenes or Workset
- Current step or G1-G7 gate
- OpenSpec link fields when selected
- Recovery point, artifacts, blockers, verification notes, and archive notes

## `@devflow:panel`

Use this for dashboard requests. The panel is a read-only view over `runtime/current.json`, task JSON, and config indexes. Adding or maintaining projects, scenes, skills, and rules stays in `@devflow:add` / `@devflow:del`.

## Commands

```bash
DevFlow init
DevFlow init --tools codex,claude-code,cursor
node scripts/contextctl.mjs task start "<title>" --projects <ids> --scenes <ids> --gate G1 --level <L1-L4>
node scripts/contextctl.mjs task update [task-id] --gate <G1-G7> --note "<progress or decision>"
node scripts/contextctl.mjs task finish [task-id] --note "<verification and handoff>"
node scripts/contextctl.mjs add project <repo-path>
```
