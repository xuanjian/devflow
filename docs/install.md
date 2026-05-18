# ai-context Installation

This document is the clean-machine install path for the public ai-context framework. It must stay free of local projects, private paths, tickets, accounts, tasks, and personal profile data.

## Prerequisites

- Git.
- npm.
- Node.js 20.19.0 or newer. OpenSpec requires this Node version.
- Codex or another AI coding tool that can read local skills.
- Codex superpowers installed or restored under `~/.codex/superpowers`.

`ai-context init` installs OpenSpec automatically unless `--skip-openspec` is passed. [OpenSpec's official installation guide](https://github.com/Fission-AI/OpenSpec/blob/main/docs/installation.md) uses `npm install -g @fission-ai/openspec@latest` and verifies with `openspec --version`.

## Fresh Install

```bash
npm install -g @xuanjames/ai-context
git clone <repo-url> ai-context
cd ai-context
npm install
ai-context init
```

`ai-context init` opens a terminal selector for AI tool targets:

- Codex
- Claude Code
- Cursor
- QoderWork
- OpenCode
- WorkBuddy

Use Up/Down to move, Space to toggle, and Enter to install.

For automated setup:

```bash
ai-context init --tools codex,claude-code,cursor
```

`ai-context init` does four things:

- Validates the ai-context skeleton.
- Links the `ai-context` and `ai-context-init` skills into selected AI tool skill directories.
- Installs OpenSpec with `npm install -g @fission-ai/openspec@latest` when it is missing.
- Reports whether OpenSpec and superpowers are available.

If you do not want the init command to mutate global npm packages:

```bash
ai-context init --skip-openspec
```

`scripts/install-ai-context.mjs setup` and `doctor` still exist for tests, CI, and low-level troubleshooting, but they are not the normal user install flow.

## First Local Initialization

After `ai-context init` completes, ask the AI tool:

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
ai-context init

# Install selected tools non-interactively
ai-context init --tools codex,claude-code,qoderwork

# Skip OpenSpec global install
ai-context init --skip-openspec

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
