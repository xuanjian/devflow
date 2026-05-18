---
name: ai-context
description: Use when entering, installing, validating, or modifying the ai-context project; also use when routing a task through project/scene/rule/skill JSON indexes or advancing G1-G7 task flow.
---

# ai-context

## Purpose

This skill is the single AI entrypoint for the local `ai-context` repository.

It keeps AI context loading small and stable:

- Read JSON indexes first.
- Treat the `ai-context` repository entry as portable source of truth; do not read or require home-level compatibility files by default.
- For development, debugging, documentation, integration, research, and context-maintenance tasks, use superpowers as the process driver; begin with `superpowers:brainstorming` unless the current continuation clearly requires a more specific superpower.
- Use `runtime/current.json` and task JSON as the task-state layer, not as the workflow driver.
- Use OpenSpec as an optional spec-driven source of truth for L3/L4, Jira/Notion/Figma/PRD-backed, cross-project, cross-device, or high-risk tasks; do not load it for routine L1/L2 edits unless already selected.
- Carry each gate's concrete output forward as the next gate's input; do not install or load `gstack` or `ce` by default.
- Select the project and scene from JSON.
- Load Markdown, rules, or other skills only when the selected JSON says they are needed.
- Store active work in `runtime/current.json` and `runtime/tasks/<task-id>.json`.

## First Files To Read

1. `<ai-context-root>/config/entry.json`
2. `<ai-context-root>/config/profile.json`
3. `<ai-context-root>/runtime/current.json`
4. Active task file from `runtime/current.json`

Do not read home-level compatibility files unless the user explicitly asks to
inspect or repair those compatibility files.

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
2. Use runtime task state to classify task size, affected projects/scenes, current G1-G7 gate, roles, verification path, blockers, recovery point, and dashboard-visible state.
3. For L3/L4 or explicit spec-backed work, select or create an OpenSpec change and record only its change id, path, status, and handoff summary in task JSON.
4. If the task is development, debugging, documentation, integration, research, or context maintenance, enter the superpower-driven flow, normally starting from `superpowers:brainstorming`.
5. Read project and scene indexes as candidate lists, then read only selected detail JSON files.
6. Load source Markdown, rules, project skills, OpenSpec artifacts, or additional superpowers only when the active superpower flow, runtime task state, or selected detail JSON requires them.
7. When a selected scene has `rules`, resolve those ids through `config/rules/rules.json` and load only the matching `scene-on-demand` rule sources when the task needs scene-level guidance.

Superpowers drive the execution discipline. OpenSpec, when selected, owns the durable requirement/specification artifact. Runtime task state makes both visible by recording size, scope, gate, roles, spec status, blockers, recovery point, and progress; it does not replace or outrank either layer.

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
- OpenSpec sync/archive result when a change was selected.
- Lessons learned or reusable decisions that should feed future specs/tasks.
- Archive notes and known gaps.

## Chat Subcommands

These chat triggers are not separate skills by default. Treat them as one
ai-context skill with different sub-intent routes. This keeps the loaded context
small: the router reads indexes first, then loads only the files needed by the
selected sub-intent.

Supported chat triggers:

- `@ai-context:add`: add or update a project, scene, skill, or rule.
- `@ai-context:task`: create, resume, or update a durable G1-G7 task.
- `@ai-context:panel`: open, explain, or validate the local task/project panel.
- `@ai-context:init`: run first-time onboarding after terminal installation.

Use another skill only when the sub-intent needs that specialist behavior. For
example, when `@ai-context:add skill` requires authoring or rewriting the actual
`SKILL.md` content, also use `superpowers:writing-skills`. Do not create one
large always-loaded skill per subcommand unless the route needs reusable domain
judgment that cannot stay in this router.

### `@ai-context:add`

Route by object:

- Project: user can provide only a project path. Scan `AGENTS.md`, `CLAUDE.md`,
  `claude.md`, `README.md`, `.cursor/rules`, and project-local `SKILL.md`
  directories. Then call the `add_project_from_path` action or equivalent
  script flow so it writes project docs, project JSON, imported skills, imported
  rules, and indexes together.
- Scene: ask which `projectIds` the scene should mount when not inferable, then
  call the `add_scene` action or equivalent script flow.
- Skill: ask which `projectIds` or family the skill should mount to when not
  inferable, then call the `add_skill_from_path` action or equivalent script
  flow. If no `SKILL.md` exists, author it first with the writing-skills flow,
  then import it.
- Rule: ask which `projectIds` and `sceneIds` should receive the rule when not
  inferable, then call the `add_rule` action or equivalent script flow.

For a new project with no AI entry docs, create an ai-context managed project
entry and docs instead of failing. If the project should also use OpenSpec for
durable specs, run or recommend `openspec init` in that project and record the
OpenSpec path/status in the ai-context project or task state. Do not run
OpenSpec for every small project unless the task is L3/L4, spec-backed, or the
user asks for it.

### `@ai-context:task`

Create or update a task JSON before work that should survive the current chat.
Infer project, scene, level, and gate from the current workspace and user text.
Ask only one concise question when the project or scope cannot be inferred.

The task route owns:

- Task title and level.
- Selected projects and scenes.
- Current G1-G7 gate.
- OpenSpec change id/path/status when OpenSpec is selected.
- Recovery point, artifacts, blockers, verification notes, and archive notes.

### `@ai-context:panel`

Use this route for dashboard requests: show what the panel is for, start the
local panel when requested, or validate the data the panel reads. The panel is a
view over `runtime/current.json`, task JSON, and config indexes; it is not a
separate source of truth.

## Commands

Use `ai-context init` for user-facing terminal installation. Use chat
subcommands such as `@ai-context:add`, `@ai-context:task`, and
`@ai-context:panel` for day-to-day AI operation. Under the hood, the AI should
use `contextctl` or core actions for ai-context maintenance. Do not hand-edit
multiple indexes for routine additions when a script/action can do it.

```bash
ai-context init
ai-context init --tools codex,claude-code,cursor
node scripts/contextctl.mjs task start "<title>" --projects <ids> --scenes <ids> --gate G1 --level <L1-L4>
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

Use the CLI for installation, and keep the install script for validation,
project entry syncing, tests, CI, and low-level troubleshooting:

```bash
ai-context init
ai-context init --tools codex,claude-code,cursor
node scripts/install-ai-context.mjs check
node scripts/install-ai-context.mjs validate
node scripts/install-ai-context.mjs install
node scripts/install-ai-context.mjs install --project-skills
node scripts/install-ai-context.mjs uninstall
node scripts/install-ai-context.mjs sync-projects
node scripts/install-ai-context.mjs sync-projects --project <project-id> --skills-only --write
```

`ai-context init` is the preferred new-machine flow. It presents a terminal multi-select for Codex, Claude Code, Cursor, QoderWork, OpenCode, and WorkBuddy; installs core skill links only into selected targets; installs OpenSpec when missing unless `--skip-openspec` is passed; and reports the next onboarding step. After install, ask the AI tool to run `ai-context-init` for first-time onboarding: it should collect the user's profile, projects, scenes, skills, and rules from rough input, then write normalized docs and JSON that the panel can display. Use `install --project-skills` on a local development machine to also reconcile mounted project skills into `.agents/.codex/.claude` directories. Reconcile means adding links for skills currently listed in `config/projects/<project-id>.json` and pruning managed links that no longer appear there. `sync-projects` previews project entry changes by default; use `--write` only when intentionally updating local project entry files.

Installation and workflow docs:

- `docs/install.md`
- `docs/project-introduction.md`

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
