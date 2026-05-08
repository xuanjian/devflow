---
alwaysApply: false
---

# DHB International Mobile Rules

Use this rule when editing the DHB international mobile project.

## Core Rules

- Match the old project UI first. Do not redesign or optimize visual details unless asked.
- Build pages from reusable components instead of hardcoded page-only UI.
- Before creating a component, search existing components and reuse the closest established pattern.
- Use TypeScript types for props and API data.
- Keep text internationalized when the module uses i18n.
- Use the project theme/fixed color system rather than ad hoc hardcoded colors.
- Preserve multi-currency display rules from nearby code.

## Workflow

1. Identify the old page or reference page.
2. Extract layout, spacing, colors, and component states.
3. Reuse or add components.
4. Compose the page.
5. Verify against the old UI and responsive states.

Historical detailed rule:

`docs/reference/rules/dhb-international-mobile/dhb-international-mobile.mdc`
