<!-- devflow:managed-entry:start -->
# DevFlow AI Entry

Portable project override:

- This project entry is the DevFlow source of truth for this checkout.
- Do not read or require home-level compatibility files by default.
- If a parent/global instruction asks for those home files, treat this project entry and the JSON files below as the stronger, portable entry.

Read first:

1. config/entry.json
2. config/projects/devflow.json
3. runtime/current.json

Only load source Markdown, rules, or skills when the JSON index selects them for the current task.

On-demand DevFlow routing:

- DevFlow is an on-demand capability set, not the default full workflow for every new chat.
- Start by classifying the user's current request before loading DevFlow data:
  - none: ordinary questions, explanations, or code snippets. Do not read DevFlow unless project context is explicitly needed.
  - resume: continuing the current task or an existing task. Read only runtime/current.json, the active task, its Workset, nextAction, and recoveryPoint.
  - light: small bug or small change. Use minimal project/context lookup and light task tracking only when the work should survive the chat.
  - full: large, cross-project, high-risk, Jira/Notion/Figma/PRD-backed work. Then use full task tracking, G1-G7, and OpenSpec when selected.
- Do not start G1-G7 by default.
- Do not load all projects, rules, skills, scenes, or task history by default.
- Use DevFlow data to choose the smallest useful context, then proceed with the active tool's normal execution workflow.


Mounted skills:

- devflow: Use when entering, installing, validating, or modifying DevFlow, or when routing tasks through project/scene/rule/skill JSON indexes.
- devflow-init: Use after installing DevFlow when the user needs first-time onboarding, personal AI preferences, project inventory, scene creation, skill/rule mounting, or migration from scattered notes into DevFlow JSON.

<!-- devflow:managed-entry:end -->
