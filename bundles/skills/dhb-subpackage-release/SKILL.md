---
name: dhb-subpackage-release
description: Use when publishing or integrating DHB_PACKAGES subpackage modules into dhbfront-cash-mini, including adding a new subpackage wrapper or updating an existing subpackage version.
---

# DHB Subpackage Release

Use this skill for the DHB_PACKAGES -> dhbfront-cash-mini release path.

## Modes

- Add wrapper: package already exists and cash-mini needs a local wrapper/export.
- Update version: package changed and cash-mini needs the new dependency version.
- Package only: user only wants the module package built or published.

## Flow

1. Confirm target module, source package, target cash-mini wrapper path, and release environment.
2. Check git status in both package repo and cash-mini before mutating.
3. Build or publish the package using the repo's established command.
4. Update cash-mini dependency/version and wrapper/export/config only when needed.
5. Run the smallest available build or local integration check.
6. Record run/package notes in task G7.

## Guardrails

- Do not switch branches, merge, publish, or push without explicit user intent.
- Do not repeat subpackage watch processes that cash-mini already manages.
- Keep package version and lockfile changes visible in the final summary.

Historical detailed notes:

- `docs/reference/skills/dhbfront-cash-mini/add-subpackage-module/SKILL.md`
- `docs/reference/skills/dhbfront-cash-mini/update-subpackage-module/SKILL.md`
