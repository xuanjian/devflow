# Frontend Core Rules

Use this rule for frontend app, H5, Taro, package, and container work before loading more specific project rules.

## User Experience

- Preserve existing product behavior and visual language unless the user asks for redesign.
- Handle loading, empty, error, disabled, and permission states when the touched flow exposes them.
- Keep user-facing text, units, currency, quantity, and status wording aligned with existing business meaning.
- Do not infer API field meaning from UI labels alone; check existing frontend, BFF, native, or old code when uncertain.

## Code Boundary

- Reuse existing components, hooks, request helpers, routing helpers, theme variables, and i18n patterns before adding new abstractions.
- Keep platform-specific logic isolated for H5, mini-program, WebView, or native bridge differences.
- Avoid hardcoded theme-sensitive colors and duplicated constants when the project already has tokens/helpers.
- Keep changes local to the selected project unless the scene explicitly includes a cross-project chain.

## Verification

- For UI changes, verify the main viewport and the relevant container mode when available.
- For API changes, verify request params, response mapping, and degraded states.
- For package or shared component changes, identify downstream projects that need rebuild, relink, or version update.
