# ai-context

ai-context is a lightweight local context registry for AI coding tools. It starts empty, then lets a user initialize their own profile, projects, scenes, skills, rules, and task flow through the `ai-context-init` skill.

## What It Does

- Keeps context small by reading JSON indexes first.
- Stores projects, scenes, skills, and rules as explicit relationships.
- Provides an install script that links the core skills into common AI tool skill directories.
- Provides an initialization skill that turns rough user input into normalized docs and JSON.
- Includes a local panel for viewing configuration, relationships, and task progress.

## Fresh Install

```bash
npm install
node scripts/install-ai-context.mjs validate
node scripts/install-ai-context.mjs install
```

After install, ask your AI tool to run the `ai-context-init` skill. That skill should interview you step by step and create local configuration for:

- personal AI preferences
- projects
- scenes
- skills
- rules
- task tracking behavior

## Local Development

```bash
npm test
npm run build
npm run dev
```

The app starts with only the `ai-context` project and the `ai-context-config` scene. Add real projects through the panel actions or by running initialization.

## Important Files

- `config/entry.json`: portable entrypoint and loading policy
- `config/profile.json`: local profile summary, empty after fresh install
- `config/projects/index.json`: project index
- `config/scenes/index.json`: scene index
- `config/skills/skills.json`: skill catalog
- `config/rules/rules.json`: rule catalog
- `runtime/current.json`: current task pointer, empty after fresh install
- `bundles/skills/ai-context/SKILL.md`: maintenance skill
- `bundles/skills/ai-context-init/SKILL.md`: onboarding skill

## Privacy

Do not commit private project paths, secrets, account identifiers, tickets, screenshots, or company-specific rules to a public template. Use `ai-context-init` to create local-only configuration after cloning.
