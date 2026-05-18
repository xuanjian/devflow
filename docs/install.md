# ai-context Installation

This document is the clean-machine install path for the public ai-context framework. It must stay free of local projects, private paths, tickets, accounts, tasks, and personal profile data.

## Prerequisites

- Git.
- npm.
- Node.js 20.19.0 or newer. OpenSpec requires this Node version.
- Codex or another AI coding tool that can read local skills.
- Codex superpowers installed or restored under `~/.codex/superpowers`.

Install OpenSpec globally when this machine will run spec-backed tasks:

```bash
npm install -g @fission-ai/openspec@latest
openspec --version
```

[OpenSpec's official installation guide](https://github.com/Fission-AI/OpenSpec/blob/main/docs/installation.md) lists the same npm package and verifies with `openspec --version`.

## Fresh Install

```bash
git clone <repo-url>
cd ai-context-lite
npm install
node scripts/install-ai-context.mjs setup --install-openspec
node scripts/install-ai-context.mjs doctor
```

`setup --install-openspec` does four things:

- Validates the ai-context skeleton.
- Links the `ai-context` and `ai-context-init` skills into common AI tool skill directories.
- Installs OpenSpec with `npm install -g @fission-ai/openspec@latest` when it is missing.
- Reports whether OpenSpec and superpowers are available.

`doctor` is stricter. It exits with failure when the core skill links, OpenSpec, or superpowers are missing.

If you do not want the script to mutate global npm packages, run plain `setup` and install OpenSpec manually only when `doctor` asks for it:

```bash
node scripts/install-ai-context.mjs setup
npm install -g @fission-ai/openspec@latest
node scripts/install-ai-context.mjs doctor
```

## First Local Initialization

After `doctor` passes, ask the AI tool:

```text
运行 ai-context-init
```

The init skill should collect local-only data and write it into the user's own checkout:

- `config/profile.json`
- `config/projects/*.json`
- `config/scenes/*.json`
- `config/skills/skills.json`
- `config/rules/rules.json`
- `docs/repos/*.md`
- `docs/scenes/*.md`
- `docs/person/profile.md`

Do not commit private output back to the public skeleton.

## Add A Project

For a local project, use the maintenance command instead of hand-editing indexes:

```bash
node scripts/contextctl.mjs add project /path/to/project --sync-projects
node scripts/install-ai-context.mjs validate
```

`contextctl` creates the project doc/config and updates indexes. `sync-projects` writes lightweight project entry files such as `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/00-ai-context.mdc` so each project can point back to this ai-context checkout.

## OpenSpec Per Project

OpenSpec is not the default for every edit. Use it when the task is L3/L4, backed by Jira/Notion/Figma/PRD, crosses projects/devices, or needs durable acceptance criteria.

Initialize OpenSpec inside the business project that owns the spec:

```bash
cd /path/to/project
openspec init
```

For small L1/L2 edits, skip OpenSpec and track only the ai-context task state when needed.

## Shared Standards

Use ai-context rules and skills for long-lived standards:

- BFF conventions.
- Frontend conventions.
- iOS conventions.
- Release and packaging conventions.
- Cross-project debugging scenes.

Use OpenSpec for per-change requirements, proposals, design notes, task lists, acceptance criteria, and archive history.

## Common Commands

```bash
# Install core skill links and print workflow dependency status
node scripts/install-ai-context.mjs setup

# Install core skill links and OpenSpec in one command
node scripts/install-ai-context.mjs setup --install-openspec

# Strict install verification
node scripts/install-ai-context.mjs doctor

# Validate JSON indexes and references
node scripts/install-ai-context.mjs validate

# Show skill link status without failing on optional tools
node scripts/install-ai-context.mjs check

# Install project-mounted skills into local project folders
node scripts/install-ai-context.mjs install --project-skills

# Preview project entry sync
node scripts/install-ai-context.mjs sync-projects

# Write project entries
node scripts/install-ai-context.mjs sync-projects --write
```

## Privacy Checklist Before Publishing

Before merging to the public master skeleton:

- `runtime/tasks/*.json` should not contain local task data.
- `docs/repos/*.md`, `docs/scenes/*.md`, and `docs/person/*.md` should not contain private project details.
- `config/projects/*.json`, `config/scenes/*.json`, `config/rules/rules.json`, and `config/skills/skills.json` should not contain private project paths or company terms.
- No token, cookie, account, ticket URL, internal repository URL, screenshot path, or personal profile detail should be committed.
