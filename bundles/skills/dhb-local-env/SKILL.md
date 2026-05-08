---
name: dhb-local-env
description: Use when running, switching, restoring, or diagnosing local DHB frontend integration environments across cash-mini, dhb-mobile-index, new_mobile_h5, customize-mini-program, or DHB_PACKAGES.
---

# DHB Local Environment

Use this skill for local DHB frontend integration setup.

## When To Use

- User asks to run a DHB local project or multi-project chain.
- User asks to switch test/pre/prod-like local env.
- User asks to restore local env after integration work.
- User mentions cash-mini, dhb-mobile-index, new_mobile_h5, customize-mini-program, or DHB_PACKAGES running together.

## Decision

- Single repo change: read the selected project JSON first, then use the repo's own README/package scripts.
- Multi-project H5/container chain: use this skill and `scripts/run-projects.js`.
- User wants visible terminals: provide terminal-by-terminal commands instead of claiming background terminals were opened.
- User asks to restore: run restore through the script if the script created backups; use git restore only when the user explicitly wants repo version.

## Commands

Dry run plan:

```bash
node bundles/skills/dhb-local-env/scripts/run-projects.js --preset preset-3 --env test --dry-run
```

Restore script-managed files:

```bash
node bundles/skills/dhb-local-env/scripts/run-projects.js --restore --dry-run
node bundles/skills/dhb-local-env/scripts/run-projects.js --restore
```

## Guardrails

- `dhb-mobile-index` should use Node 12.20.0 through Volta when running webpack4.
- Do not mutate config files before showing a dry-run plan.
- Do not start duplicate subpackage watches when cash-mini already watches subpackages.
- Preserve user-local changes; backups represent the state before this script mutates files, not necessarily git HEAD.

Historical split skills:

- `docs/reference/skills/run-projects/SKILL.md`
- `docs/reference/skills/dhb-env-switch/SKILL.md`
- `docs/reference/skills/restore-local-env/SKILL.md`
