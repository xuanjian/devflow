# Scene Rule: Frontend BFF Debug

Use this rule when a selected task involves frontend and BFF integration.

## Scope Control

- Select the exact frontend project and exact BFF service from the requirement, route, API path, or observed error.
- Do not load or modify every BFF service just because the scene includes multiple candidates.
- Confirm whether the bug is frontend mapping, BFF orchestration, upstream service behavior, cache, or environment routing before editing.

## Contract Work

- Record request path, params, response shape, field ownership, and affected callers in the task notes.
- If the frontend needs a new field, verify whether BFF can derive it safely or must pass through upstream data.
- Keep temporary mock data or local proxy changes out of commits unless the task explicitly asks for them.

## Verification

- Prefer one minimal API reproduction plus one frontend flow verification.
- If either side cannot be run locally, document the missing side and the evidence used instead.
