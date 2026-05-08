---
name: add-mobile-icon
description: Use when adding SVG mobile image assets to dhbfront-img for DHB frontend packages, including fixed-color icons or theme-color icon variants.
---

# Add Mobile Icon

Use this skill when adding icons under `/Users/xj/Documents/frontend/dhbfront-img/image/mobile-img`.

## Inputs

- Module directory, such as goods/order/payment/cart.
- Icon filename.
- Fixed color or theme color.
- SVG content or source asset.

## Paths

- Fixed icon: `image/mobile-img/<module>/<icon>.svg`
- Theme icon: `image/mobile-img/<module>/theme/<1-7>/<icon>.svg`

Theme colors:

- `1`: `#FF6645`
- `2`: `#47B203`
- `3`: `#2E5DDF`
- `4`: `#FF6645`
- `5`: `#222222`
- `6`: `#EC1919`
- `7`: `#FF778A`

## Flow

1. Validate the SVG is safe and has a stable viewBox.
2. Create the module directory if missing.
3. For fixed icons, write one SVG.
4. For theme icons, write one SVG per theme directory and replace fill/stroke colors carefully.
5. If the consuming package lacks an image helper, copy the nearest existing `imgUtils.ts` pattern.
6. Report the generated file paths and any consuming-code changes.

Historical detailed note:

`docs/reference/skills/dhb-packages/add-mobile-icon.md`
