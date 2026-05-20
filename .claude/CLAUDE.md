

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

Mounted skills:

- devflow: Use when entering, installing, validating, or modifying DevFlow, or when routing tasks through project/scene/rule/skill JSON indexes.
- devflow-init: Use after installing DevFlow when the user needs first-time onboarding, personal AI preferences, project inventory, scene creation, skill/rule mounting, or migration from scattered notes into DevFlow JSON.

<!-- devflow:managed-entry:end -->
