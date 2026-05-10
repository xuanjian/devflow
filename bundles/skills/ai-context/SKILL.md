---
name: ai-context
description: Use when entering, installing, validating, or modifying the ai-context project; also use when routing a task through project/scene/rule/skill JSON indexes or advancing G1-G7 task flow.
---

# ai-context

## Purpose

This skill is the single AI entrypoint for the local `ai-context` repository.

It keeps AI context loading small and stable:

- Read JSON indexes first.
- For development, debugging, documentation, integration, research, and context-maintenance tasks, use superpowers as the process driver; begin with `superpowers:brainstorming` unless the current continuation clearly requires a more specific superpower.
- Use `ai-task-board` as the task-state and project-scope layer, not as the workflow driver.
- Select the project and scene from JSON.
- Load Markdown, rules, or other skills only when the selected JSON says they are needed.
- Store active work in `runtime/current.json` and `runtime/tasks/<task-id>.json`.

## First Files To Read

1. `<ai-context-root>/config/entry.json`
2. `<ai-context-root>/config/profile.json`
3. `<ai-context-root>/runtime/current.json`
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

1. Read entry/profile/current JSON.
2. If the task is development, debugging, documentation, integration, research, or context maintenance, enter the superpower-driven flow first, normally starting from `superpowers:brainstorming`.
3. Use `ai-task-board` to classify task size, affected projects/scenes, current G1-G7 gate, roles, verification path, blockers, recovery point, and dashboard-visible state.
4. Read project and scene indexes as candidate lists, then read only selected detail JSON files.
5. Load source Markdown, rules, project skills, or additional superpowers only when the active superpower flow, `ai-task-board` task state, or selected detail JSON requires them.
6. When a selected scene has `rules`, resolve those ids through `config/rules/rules.json` and load only the matching `scene-on-demand` rule sources when the task needs scene-level guidance.

Superpowers drive the workflow. `ai-task-board` makes that workflow visible by recording size, scope, gate, roles, blockers, recovery point, and progress; it does not replace or outrank superpower process rules.

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

Use `contextctl` for setup checks and ai-context maintenance. Do not hand-edit
multiple indexes for routine additions when a `contextctl` command can do it.

```bash
node scripts/contextctl.mjs doctor
node scripts/contextctl.mjs task start "<title>" --projects <ids> --scenes ai-task-board --gate G1 --level <L1-L4>
node scripts/contextctl.mjs task update [task-id] --gate <G1-G7> --note "<progress or decision>"
node scripts/contextctl.mjs task finish [task-id] --note "<verification and handoff>"
node scripts/contextctl.mjs add project <repo-path>
```

## Default Task Creation Triggers

In any project window that can read this ai-context entry, default to creating
or updating a task JSON through `contextctl task ...` whenever the request looks
like real work that should survive the current chat. This is not tied to a
specific project, product, or active task.

Do this before implementation for:

- Any Jira, issue, ticket, Notion task, Figma task, PRD, spec, or external task
  identifier/link provided by the user.
- Requests to add a module, page, feature, workflow, API, integration, build
  route, release route, or other multi-file/multi-step capability.
- "改一个需求" / "新增需求" / "这个需求" when the change is not obviously a
  one-line fix, especially if discovery, plan, implementation, acceptance, or
  handoff may be needed.
- Cross-project, cross-device, CI/CD, release, packaging, App Store, GitHub,
  GitLab, Xcode Cloud, signing, credentials, migration, data, permission, money,
  inventory, or other high-risk workflow work.
- Any L3/L4 task, any work expected to continue across sessions or days, or any
  task where future windows should know the current gate and recovery point.
- Any user wording like "建 task", "走 ai-context task", "同步到 task",
  "按 G1-G7", "后面继续", "记录这个流程", "自动去写", or "任务看板".

If unsure whether a development request is L1 or L2+, bias toward starting a
light task and set the level honestly. Ask only when the target project cannot
be inferred from the current workspace, Jira/source text, or project index.

For small L1/L2 edits, update the active task only when the user asks to track
it, the task already belongs to an active tracked flow, or the edit changes
release/build/deployment behavior. Do not store throwaway chat or one-line
answers as tasks.

Use the install script for installation, validation, and project entry syncing:

```bash
node scripts/install-ai-context.mjs check
node scripts/install-ai-context.mjs validate
node scripts/install-ai-context.mjs install
node scripts/install-ai-context.mjs install --project-skills
node scripts/install-ai-context.mjs uninstall
node scripts/install-ai-context.mjs sync-projects
node scripts/install-ai-context.mjs sync-projects --project <project-id> --skills-only --write
```

`install` only installs ai-context skill links by default. Use `install --project-skills` on a local development machine to also reconcile mounted project skills into `.agents/.codex/.claude` directories. Reconcile means adding links for skills currently listed in `config/projects/<project-id>.json` and pruning managed links that no longer appear there. `sync-projects` previews project entry changes by default; use `--write` only when intentionally updating local project entry files.

When local project paths differ from the absolute paths in JSON, set `AI_CONTEXT_PROJECT_ROOTS` to one or more local search roots, or set `AI_CONTEXT_PROJECT_PATH_OVERRIDES` as `project-id=/local/path;project-id-2=/local/path`.

## Maintenance Flow

For adding a project, ask only for the repository path first, then use:

```bash
node scripts/contextctl.mjs add project <repo-path>
```

The command owns the fixed flow:

1. Infer project id, name, technology family, repo type, summary, and tags.
2. Ask which scenes to mount.
3. Ask which project rules to mount.
4. Ask which skills to mount.
5. Write `docs/repos/<id>.md`, `config/projects/<id>.json`, update indexes, update selected scene memberships, update selected rule metadata, and run validation.

If `contextctl` cannot support a maintenance operation yet, extend `contextctl`
first. Avoid manually keeping project JSON, scene JSON, rule catalog, skill
catalog, and docs in sync by memory.

## Maintenance Triggers

Use this `ai-context` skill as the maintenance entrypoint for:

- Adding, archiving, or updating a project in ai-context.
- Adding, archiving, or updating a scene in ai-context.
- Adding, archiving, or updating a rule in ai-context.
- Registering, mounting, or removing a skill in ai-context.
- Running install, doctor, validate, sync, or bootstrap checks.

Then route by object:

- Project maintenance: use `contextctl add project <repo-path>` when available.
- Scene maintenance: use `contextctl add scene ...` when available; if missing, extend `contextctl` first.
- Rule maintenance: use `contextctl add rule ...` when available; if missing, extend `contextctl` first.
- Skill registration or mounting: use `contextctl add skill ...` when available; if missing, extend `contextctl` first.
- Skill authoring or behavior changes: also use `superpowers:writing-skills` because the reusable skill content itself is being created or changed.

Do not create separate project/rule/scene maintenance skills unless the work
needs reusable domain judgment that cannot be enforced by `contextctl`.

## Write Rules

- Prefer updating JSON indexes through scripts.
- If manually editing JSON, run `node scripts/install-ai-context.mjs validate`.
- Keep active rule files as `.md` under `bundles/rules/**`; `.mdc` is only for generated Cursor entrypoints or archived reference material.
- Keep original Markdown/rule/skill knowledge by moving long or old content to `docs/reference/**`; do not delete it just to reduce context.
- Deprecate `runtime/current-work.md`; current state belongs in `runtime/current.json` plus task JSON.
