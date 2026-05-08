# ai-context docs

This folder contains human-readable source documents and prototypes.

## Structure

```text
person/                 # Long-term profile, learning log, profile candidates
repos/                  # One Markdown introduction per project/repository
scenes/                 # Human-readable workflow and scenario descriptions
templates/              # G1-G7 task artifact templates
prototypes/             # Product/UI prototypes
reference/              # Archived long rules, old skills, and detailed examples
superpowers/plans/      # Historical implementation plans
*.md                    # Design notes, migration notes, and historical docs
```

Machine-readable indexes stay in `../config/`.
Runtime task state stays in `../runtime/`.
Executable skills and rule bundles stay in `../bundles/`.

Files under `reference/` are not active by default. Active rules and skills are listed only in `../config/rules/rules.json` and `../config/skills/skills.json`.

Active rules use `.md`. Old `.mdc` files belong only to archived Cursor-era reference material or generated project-level Cursor entrypoints.
