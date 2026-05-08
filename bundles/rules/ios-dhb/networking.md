---
description: DHB iOS networking rules for DHBBaseNetworkRequest, Node service requests, coobjc, service/controller boundaries.
alwaysApply: false
---

# DHB iOS Networking Rules

Use this rule when adding or changing iOS network requests, service methods, or WebView bridge data loading.

## Request Type

- Standard `dhb168-api` request: subclass the existing API request base used by nearby files and provide controller/action/method according to local examples.
- Node/BFF request: subclass the existing Node service request base used by nearby files and provide interface path, params, and method according to local examples.
- Prefer copying the closest working request/service pair in the same module before inventing a new pattern.

## Service Boundary

- Keep request assembly in Request classes.
- Keep async orchestration and model conversion in Service classes.
- Keep controller code focused on UI state, navigation, and calling service methods.
- Preserve existing `coobjc` / coroutine style when the module already uses it.
- When returning multiple values through tuple helpers, keep value count and order explicit and verify each caller.

## Safety

- Do not block the main thread for network work.
- Validate nil/empty arrays and unexpected response shapes before updating UI.
- Keep error display consistent with nearby screens.

## Read More Only If Needed

Historical detailed networking notes were moved to:

`docs/reference/rules/ios-dhb/012-networking.mdc`
`docs/reference/rules/ios-dhb/NETWORKING_UPDATE_V2.1.md`
