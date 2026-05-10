---
name: ai-task-board
description: Use when a development task needs visible task state, G1-G7 progress, task size, project scope, role state, blockers, recovery point, or future dashboard tracking.
---

# ai-task-board

## Overview

Use this archived reference as the task-board state guide for XUANJIAN's workflow.

Superpowers drive the process. `ai-task-board` records where that process is: task size, affected projects, current Gate, roles, blockers, recovery point, verification state, and dashboard-visible progress.

The active source of truth is:

```text
/Users/xj/Documents/ai-context/docs/scenes/ai-task-board.md
```

## Core Rules

- Do not use `ai-task-board` as the workflow driver.
- Start development and maintenance work through the relevant superpower flow, normally `superpowers:brainstorming` first.
- Use `ai-task-board` to classify L1-L4 task size and G1-G7 state.
- Keep the main task stack when the user adds mid-flow guidance; after handling the guidance or blocker, resume the original superpower flow.
- Track affected projects, selected scenes, role checklist, write boundaries, verification path, blockers, and recovery point.
- Only spawn Codex subagents when the user explicitly authorizes multi-agent, subagent, delegation, or parallel agent work.

## State Fields

| Field | Purpose |
| --- | --- |
| taskLevel | L1 / L2 / L3 / L4 |
| currentGate | G1-G7 dashboard state |
| activeSuperpower | Current process driver |
| nextSuperpowerStep | Where to resume |
| projectIds | Selected projects |
| sceneIds | Selected scenes |
| roleState | Local checklist or authorized subagents |
| blockers | Permission, conflicts, account, external systems, user decisions |
| recoveryPoint | Main task next step after interruption |
| verification | Commands run, not run, residual risk |

## Final Response

Include task level, current Gate, active superpower flow, projects, execution state, blockers, verification, and residual risk when this state matters.
