# Scene Rule: iOS H5 WebView BFF

Use this rule when iOS native, H5, WebView bridge, container routing, or BFF behavior is part of the same task.

## Ownership

- Identify whether the user-visible behavior belongs to native, H5, container, BFF, or upstream service before editing.
- For JSBridge work, document method name, payload, callback shape, ownership, and compatibility fallback.
- Do not assume a print, payment, inventory, or order action is H5-only when native already owns the final behavior.

## Data Contract

- Verify field meaning across native code, H5 code, and BFF before renaming or remapping quantities, prices, statuses, or IDs.
- Keep bridge payload additions backward compatible when older native/H5 versions may exist.
- If native build is user-owned, still document what changed and what native verification remains.

## Verification

- Verify one H5/container path and one contract-level native/BFF expectation when possible.
- Archive run mode, debug entry, package target, and unverified native steps in G7.
