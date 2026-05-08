---
description: DHB iOS core rules for project structure, naming, layout, model, memory, thread, and forbidden practices.
alwaysApply: false
---

# DHB iOS Core Rules

Use this rule when editing `/Users/xj/Documents/ios/DHB`.

## Must Follow

- Class names use the `DHB` prefix unless the existing local module clearly uses another established prefix.
- Keep Objective-C file structure predictable: imports, constants, lifecycle, UI setup, data loading, actions, private methods, getters.
- Use SDAutoLayout in existing Objective-C UI. Do not replace it with Masonry.
- UI work stays on the main thread. Move expensive work off the main thread.
- Use weak delegates and weak/strong dance in blocks that capture `self`.
- Remove observers, timers, and callbacks that can retain controllers.
- Avoid hardcoded user-facing Chinese text when the surrounding module already uses i18n.
- Avoid hardcoded theme colors when the surrounding module uses `ChangeSkinManager`.
- Do not modify third-party source code directly.
- Do not add UIWebView.

## Read More Only If Needed

Historical detailed rules were moved to:

`docs/reference/rules/ios-dhb/`
