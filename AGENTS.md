<!-- devflow:managed-entry:start -->
# DevFlow AI Entry

Portable project override:

- This project entry is the DevFlow source of truth for this checkout.
- Do not read or require home-level compatibility files by default.
- Use the JSON files below first, then load Markdown, rules, or skills only when selected by task context.

Read first:

1. config/entry.json
2. config/projects/devflow.json
3. runtime/current.json

Fresh install:

- Run `node scripts/install-ai-context.mjs install`.
- Then ask the AI tool to run the `devflow-init` skill to configure profile, projects, scenes, skills, and rules.

Mounted skills:

- devflow
- devflow-init

<!-- devflow:managed-entry:end -->
