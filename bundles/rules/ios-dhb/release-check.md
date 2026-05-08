---
description: DHB iOS verification, review, and packaging checklist.
alwaysApply: false
---

# DHB iOS Release Check

Use this rule before claiming an iOS task is ready, or when the task involves packaging/release.

## Before Handoff

- Check changed files for unrelated edits.
- Verify user-facing text, theme color, empty state, error state, and loading state when touched.
- For WebView/JSBridge work, document method name, payload, callback, and native/H5 ownership.
- For inventory/order/payment flows, verify field meaning against existing native or BFF usage before renaming.
- If the user says they will run Xcode, do not treat local Xcode build as a blocker; still document what was not run.

## Packaging Notes

- Keep environment, signing, version, and branch instructions in the task G7 archive rather than in long-term profile.
- Use project-local release scripts and current team process; do not invent a new release path from these rules.

## Read More Only If Needed

Historical checklists were moved to:

`docs/reference/rules/ios-dhb/050-testing.mdc`
`docs/reference/rules/ios-dhb/051-deployment.mdc`
`docs/reference/rules/ios-dhb/053-code-review.mdc`
