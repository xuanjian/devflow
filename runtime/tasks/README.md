# Runtime Tasks

`runtime/tasks/` stores active or historical task state. Current task discovery starts from:

```text
runtime/current.json
```

Each task can be stored as:

```text
runtime/tasks/<task-id>.json
```

Long Markdown artifacts are still allowed for complex tasks, but the JSON task file is the default state authority.

## G1-G7

The canonical gate list lives in:

```text
config/tasks/gates.json
```

Summary:

| Gate | Purpose |
| --- | --- |
| G1 Intent / Intake | Understand the request, classify task type, decide whether a full flow is needed. |
| G2 Discovery | Select project, scene, rule, and skill indexes; read source files only as needed. |
| G3 Plan / Product UI | Produce plan, product notes, UI prototype, or technical approach before development. |
| G4 Development | Execute project work using selected project JSON, rules, and skills. |
| G5 Integration | Record run/debug commands, environment switching, cross-project integration, and blockers. |
| G6 Acceptance | Verify against requirements, UI, interfaces, diff, and test results. |
| G7 Run / Package Archive | Archive debug/run steps, test/pre/prod package steps, verification result, and release notes. |

## Current Work

`runtime/current-work.md` is deprecated. Do not read or update it.

Use:

```text
runtime/current.json
runtime/tasks/<activeTaskId>.json
```

## Sensitive Data

Do not store passwords, tokens, production secrets, or private customer data in task files.
