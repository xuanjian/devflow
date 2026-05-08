---
name: ai-my-pm
description: Use when the user describes a development requirement and expects Codex to infer implementation plan, projects, tools, roles, workflow, technologies, OpenSpec needs, or role-based multi-agent planning across DHB/HXB repos.
---

# ai-my-pm

## Overview

Use this skill as XUANJIAN's personal AI project manager. The user only needs to describe the requirement; Codex must infer the implementation approach, affected projects, tools, workflow, technologies, roles, and verification path. The source of truth is `scenes/ai-my-pm.md`.

## First Read

Before acting, read:

1. `/Users/xj/Documents/ai-context/scenes/ai-my-pm.md`
2. `/Users/xj/Documents/ai-context/person/profile.md`
3. `/Users/xj/Documents/ai-context/runtime/current-work.md`
4. Relevant `repos/*.md` and scene files for the current task
5. `/Users/xj/Documents/ai-context/registry/clients.json`
6. `/Users/xj/Documents/ai-context/registry/repo-tools.json`
7. `/Users/xj/Documents/ai-context/registry/notion-sources.json`

## Core Rules

- Do not install or invoke an external harness unless the user explicitly asks for it.
- Use Codex native execution first.
- Treat `ai-my-pm` as the PM router and decision layer.
- Do not require the user to name projects, tools, roles, flows, or skills when the requirement provides enough clues to infer them.
- Prefer existing project technologies, wrappers, directory conventions, and local skills over new abstractions.
- For DHB/HXB project routing, use the Notion `DHB 项目地图` registered in `registry/notion-sources.json` when local context is insufficient or project relationships matter.
- Treat superpowers as execution discipline. Select only the necessary superpowers for the task instead of loading all of them by default.
- Treat `ai-dev-team mode` as a role framework inside `ai-my-pm`, used for L3/L4 work or explicit multi-role requests.
- Only spawn Codex subagents when the user explicitly authorizes multi-agent, subagent, delegation, or parallel agent work.
- Explorer and Reviewer are read-only unless the user explicitly assigns them a write task.
- Every writing worker must have a clear repo/file ownership boundary.

## Task Classification

Classify the task before choosing execution mode:

| Level | Use For | Default Mode |
| --- | --- | --- |
| L1 | single-file edits, small UI/text/bug fixes | Codex single agent |
| L2 | one page, one API, one local workflow | Architect checklist + single worker + reviewer pass |
| L3 | cross-repo or cross-platform feature | ai-dev-team mode, optional Codex subagents if authorized |
| L4 | auth, payment, permission, inventory, migrations, releases | plan/OpenSpec first, read-only exploration before writes |

## Execution Flow

1. Restate the requirement as an implementation goal.
2. Infer the task type, affected projects, modules, technologies, and risk level.
3. Identify relevant repos, scenes, registry entries, Notion project-map pages, and project skills.
4. Decide whether OpenSpec, Notion, Figma, Playwright, Xcode, BFF debugging, project skills, or superpowers are needed.
5. Choose execution discipline:
   - unclear requirement: `superpowers:brainstorming`
   - multi-step implementation: `superpowers:writing-plans`
   - feature or bugfix implementation: `superpowers:test-driven-development`
   - bug, failure, or unknown cause: `superpowers:systematic-debugging`
   - before claiming completion: `superpowers:verification-before-completion`
   - large or risky diff: `superpowers:requesting-code-review`
   - review feedback: `superpowers:receiving-code-review`
6. Choose execution mode: single agent, PM checklist, ai-dev-team mode, or authorized Codex subagents.
7. If subagents are authorized, assign concrete non-overlapping tasks.
8. If subagents are not authorized, use roles as a local checklist.
9. Implement only after boundaries are clear.
10. Verify with the smallest meaningful command set.
11. Summarize changed files, validation, and residual risk.

## Role Defaults

- Architect: requirements, plan, risks, repo boundaries. Read-only.
- Explorer: code/doc search and field mapping. Read-only.
- Frontend Engineer: React, Taro, H5, mini-program UI.
- BFF Engineer: Egg.js, API fields, cache, database, Swagger.
- iOS Engineer: Objective-C / Swift, WebView, JSBridge.
- QA Engineer: tests, builds, regression paths.
- Reviewer: diff review, missing tests, behavioral risk. Read-only.

## OpenSpec

Use OpenSpec for L3/L4 work when requirements need durable proposal/design/tasks or cross-session tracking. OpenSpec belongs in the main affected business repo, not in `ai-context`, unless the task is about `ai-context` itself.

## Context Maintenance

When the work changes durable context, update the right layer:

- Current phase: `runtime/current-work.md`
- Stable learning: `person/learning-log.md` and `person/profile-candidates.md`
- Long-term profile: `person/profile.md` only when the information is stable, general, and useful
- Project facts: relevant `repos/*.md` or Notion page

## Final Response

Include:

- Requirement understanding
- Task level
- Projects, modules, technologies, tools, and workflow selected
- Superpowers selected, when applicable
- Execution mode
- Roles used, when applicable
- Files changed
- Verification run
- Any unresolved risks or decisions
