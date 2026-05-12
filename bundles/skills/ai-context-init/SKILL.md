---
name: ai-context-init
description: Use after installing ai-context when the user needs first-time onboarding, personal AI preferences, project inventory, scene creation, skill/rule mounting, or migration from scattered notes into ai-context JSON.
---

# ai-context-init

## Purpose

Use this skill immediately after `ai-context` is installed, or whenever a user wants to initialize their own ai-context setup from rough notes.

The user should not need to design JSON. You interview them, normalize messy information, write the repository's config/docs, and verify the existing ai-context panel can display the result.

## Privacy Boundary

- Do not write secrets, credentials, tokens, private ticket URLs, private account identifiers, or personal identity details into public files.
- Local machine paths are allowed only in the user's private/local ai-context checkout.
- If the user is preparing a public template, replace private project names and paths with generic placeholders.

## Read First

1. `config/entry.json`
2. `config/profile.json`
3. `runtime/current.json`
4. `config/projects/index.json`
5. `config/scenes/index.json`
6. `config/skills/skills.json`
7. `config/rules/rules.json`

Do not bulk-read `docs/repos/**`, `bundles/rules/**`, or `bundles/skills/**` until a selected project, scene, skill, or rule requires it.

## Interview Flow

Ask in small batches. Stop after each batch if the answer is unclear.

1. Personal profile:
   - What should AI remember about the user's work style?
   - Which context should stay private or local-only?
   - How should tasks be tracked: lightweight, G1-G7, or only for larger work?

2. Projects:
   - Which projects should be registered first?
   - Ask for local paths when available.
   - For each path, inspect project guide files such as `AGENTS.md`, `CLAUDE.md`, `README.md`, `.cursor/rules/*.mdc`, and project-local skills.

3. Scenes:
   - Ask whether common cross-project scenes are needed.
   - Examples: single repo change, frontend plus API debugging, iOS WebView plus BFF, release/package, documentation cleanup, AI workflow maintenance.
   - For each scene, identify mounted projects and scene-level rules.

4. Skills:
   - Ask whether there are existing `SKILL.md` folders to import.
   - Ask which projects or scenes should load each skill.

5. Rules:
   - Ask whether there are existing rule files.
   - If no file exists, ask for the rule's purpose and generate a concise `.md` rule file.
   - Decide `applyMode`: `project-on-demand` for project rules, `scene-on-demand` for scene behavior, `manual` only for reference rules.

## Normalized Draft Shape

Before writing files, normalize the conversation into this shape:

```json
{
  "profile": {
    "role": "",
    "preferences": [],
    "privacy": []
  },
  "projects": [
    {
      "id": "",
      "name": "",
      "path": "",
      "technologyFamilyId": "",
      "summary": "",
      "sceneIds": [],
      "skillIds": [],
      "ruleIds": []
    }
  ],
  "scenes": [
    {
      "id": "",
      "name": "",
      "summary": "",
      "purpose": "",
      "projectIds": [],
      "skillIds": [],
      "ruleIds": []
    }
  ],
  "skills": [
    {
      "id": "",
      "name": "",
      "description": "",
      "skillPath": "",
      "projectIds": [],
      "sceneIds": []
    }
  ],
  "rules": [
    {
      "id": "",
      "name": "",
      "purpose": "",
      "sourcePath": "",
      "applyMode": "project-on-demand",
      "projectIds": [],
      "sceneIds": []
    }
  ]
}
```

## Write Path

Prefer the existing maintenance actions and scripts over hand-editing multiple files:

- Add project: use the panel action `add_project_from_path` or the equivalent backend action. It scans project docs, imports project-local skills/rules, writes `docs/repos/<id>.md`, writes `config/projects/<id>.json`, updates `config/projects/index.json`, and adds the managed project entry note.
- Add scene: use `add_scene` with scene id/name, purpose, and mounted project ids.
- Add skill: use `add_skill_from_path` when a `SKILL.md` path exists; otherwise register only after the user confirms the generated skill content.
- Add rule: use `add_rule`; if no source file exists, provide `purpose` so the action can generate a rule template.

When manual edits are unavoidable, update all affected files together:

- `config/projects/index.json`
- `config/projects/<project-id>.json`
- `docs/repos/<project-id>.md`
- `config/scenes/index.json`
- `config/scenes/<scene-id>.json`
- `config/skills/skills.json`
- `config/rules/rules.json`
- `bundles/skills/<skill-id>/SKILL.md`
- `bundles/rules/<rule-id>.md`

## Panel Safety

The panel reads JSON indexes and relationship arrays. Before completion, verify:

- Every project index item points to an existing `config/projects/<id>.json`.
- Every scene index item points to an existing `config/scenes/<id>.json`.
- Project `skills`, `rules`, and `scenes` reference catalog/index ids that exist.
- Scene `projects` and `rules` reference existing project/rule ids.
- Rule catalog entries have `sourcePath`, `applyMode`, non-empty `globs`, and `whenToRead`.

## Verification

Do not say initialization is complete until these pass:

```bash
node scripts/install-ai-context.mjs validate
npm test
```

Then start or refresh the existing ai-context panel and confirm the new projects, scenes, skills, and rules appear without a JSON or graph reference error.
