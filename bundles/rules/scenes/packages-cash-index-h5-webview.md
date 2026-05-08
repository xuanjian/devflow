# Scene Rule: Packages Cash Index H5 WebView

Use this rule when `DHB_PACKAGES`, `dhbfront-cash-mini`, `dhb-mobile-index`, `new_mobile_h5`, mini-program, or iOS container participate in one chain.

## Chain Order

- Identify the source package/module first, then downstream wrapper, H5 entry, legacy container, and native or mini-program container.
- For package changes, rebuild or relink the upstream package before debugging downstream behavior.
- Keep package version, local link, and published dependency mode explicit in task notes.

## Boundary

- Put reusable package behavior in `DHB_PACKAGES`.
- Put cross-platform wrapper/export behavior in `dhbfront-cash-mini`.
- Put H5 route/page behavior in `dhb-mobile-index`.
- Put legacy iframe/container behavior in `new_mobile_h5`.
- Put native/WebView or mini-program container behavior in the corresponding container project.

## Verification

- Verify the shortest chain that proves the change, then list downstream containers not run.
- Record test/pre/prod packaging differences in G7 when the task affects release flow.
