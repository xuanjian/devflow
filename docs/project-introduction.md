# ai-context Project Introduction

ai-context is a portable local context framework for AI coding tools. Its job is not to load every document into the model. Its job is to route the current request to the smallest useful set of project, scene, rule, skill, spec, and task-state files.

## Core Layers

ai-context uses four layers:

- ai-context: the routing and state layer. It stores project indexes, scene indexes, rules, skills, and task JSON.
- superpowers: the execution discipline layer. It drives brainstorming, TDD, debugging, planning, verification, review, and branch finishing.
- OpenSpec: the optional spec-driven layer. It is used for L3/L4 work, PRD/Jira/Notion/Figma-backed work, cross-project work, or high-risk changes.
- task board: the visibility layer. It shows active task state, gate progress, relationships, and checks from the JSON indexes.

Do not install `gstack` or `ce` as default workflow tools. ai-context only borrows the useful handoff idea: every stage leaves a compact artifact that feeds the next stage.

## Task Flow

Tracked tasks move through G1-G7:

- G1 Intent / Intake: record the goal, scope, level, selected projects/scenes, and whether OpenSpec is needed.
- G2 Discovery: gather evidence, constraints, upstream links, and unknowns.
- G3 Plan / Product UI: produce the plan, UI notes, technical design, or OpenSpec proposal/design/tasks/spec delta.
- G4 Development: implement within the selected write scope and record changed files and expected verification.
- G5 Integration: run or connect affected projects, environments, APIs, devices, and packaging flows.
- G6 Acceptance: compare the result with the user request, OpenSpec, UI, interface behavior, diff, and tests.
- G7 Run / Package Archive: record run/debug/package steps, final verification, known gaps, OpenSpec archive status, and lessons learned.

Each gate should leave a short handoff note or artifact. The next gate starts from that output instead of rediscovering the same context.

## OpenSpec Usage

Use OpenSpec when the task needs a durable spec:

- L3/L4 change.
- External input from Jira, Notion, Figma, PRD, or a formal ticket.
- Cross-project or cross-device behavior.
- High-risk work such as release, packaging, permissions, money, data migration, inventory, or account flows.

Do not use OpenSpec for every small edit. For L1/L2 work, ai-context task state plus superpowers execution is usually enough.

When OpenSpec is selected, task JSON should store only the compact link information:

- `spec.tool`
- `spec.changeId`
- `spec.path`
- `spec.status`
- `spec.handoff`

At G7, completed OpenSpec changes should be archived so the finished delta is merged back into durable specs and the completed change moves to the archive area. Lessons learned should be recorded as a compact task note or follow-up artifact before archive when they should influence future work.

## Rules And Skills

Use rules and skills for durable standards that should apply across many tasks:

- BFF family conventions.
- Frontend family conventions.
- iOS family conventions.
- Release and packaging conventions.
- Scene-specific debugging or integration flows.

Rules answer "what constraints apply here?" Skills answer "what reusable capability should the AI load here?" OpenSpec answers "what is this particular change supposed to do?"

## Task Board

The board reads the same JSON that AI tools read:

- `runtime/current.json`: active task pointer.
- `runtime/tasks/*.json`: gate, level, progress, blockers, recovery point, verification, and spec status.
- `config/projects/*.json`: project cards and mounted scenes/skills/rules.
- `config/scenes/*.json`: workflow scenes and cross-project relationships.
- `config/skills/skills.json`: reusable capability catalog.
- `config/rules/rules.json`: durable rule catalog.

Use the board to answer:

- What task is active?
- Which gate is it in?
- Which projects and scenes are selected?
- Is OpenSpec selected?
- What is blocked?
- What was verified?
- Where should a future session resume?

Run it locally:

```bash
npm run dev
```

Then open the URL printed by Vite, usually `http://127.0.0.1:5173/`.

## Typical Workflow

1. User states a goal.
2. ai-context selects the project, scene, task level, and whether OpenSpec is needed.
3. For tracked work, `contextctl task start` writes the task JSON.
4. The AI loads only selected project/scene/rule/skill/spec context.
5. superpowers drives planning, TDD, debugging, verification, and review.
6. Each G1-G7 gate leaves a compact handoff note.
7. The board shows progress and recovery state.
8. At G7, the task records run/package/archive notes, OpenSpec archive result if used, and reusable lessons.

## Public Skeleton Boundary

The public master branch is an empty framework. It should include scripts, schemas, docs, bundled generic skills, tests, and examples. It should not include local task data, private project docs, personal profile data, company names, internal repository paths, tickets, tokens, or screenshots.
