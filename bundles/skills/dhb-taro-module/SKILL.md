---
name: dhb-taro-module
description: Use when creating a new Taro business module/package under DHB_PACKAGES.
---

# DHB Taro Module

Use this skill when adding a new package under `/Users/xj/Documents/frontend/DHB_PACKAGES`.

## Required Inputs

- Domain name, such as goods/order/payment.
- Module name, such as goods-poster.
- Whether the module needs API service, demo page, images, and i18n.

## Minimal Flow

1. Inspect nearby packages in the same domain.
2. Create package folder and `package.json` matching naming/version conventions.
3. Add TypeScript config and package entry files.
4. Add component, demo, i18n, service, and image helper only when needed.
5. Register the demo in the development shell.
6. Run package-local type/build command when available.

## Guardrails

- Do not add `exports["./demo"]` to the business package just for the dev shell; use dev-shell alias if that is the established pattern.
- User-visible text should follow the package i18n convention.
- Keep generated files minimal and aligned with the nearest existing package.

Detailed historical template:

`docs/reference/skills/dhb-packages/add-taro-module.md`
