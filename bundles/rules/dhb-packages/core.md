# DHB_PACKAGES Core Rules

Use this rule for `/Users/xj/Documents/frontend/DHB_PACKAGES`.

## UI Text

- User-visible text in Taro packages should use i18n when the package already has i18n.
- Chinese can be used as the key when matching existing package convention.
- Do not internationalize logs, comments, route names, CSS class names, or internal constants.

## Theme Color

- Dynamic brand/theme colors should come from the project theme helper or existing nearby pattern.
- Avoid hardcoding theme-sensitive colors inside SCSS when runtime theme switching is expected.
- Fixed neutral colors are acceptable when they are visual assets or exact UI constants.

## Module Work

- Keep package exports, demo entry, and shell routing consistent with nearby packages.
- When adding an image/icon dependency, check `dhbfront-img` path and runtime URL helper.

Historical detailed notes:

- `docs/reference/rules/theme-config.mdc`
- `docs/reference/rules/i18n-chinese-key.mdc`
