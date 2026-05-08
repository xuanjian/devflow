# egg-business Integration Rules

Use this rule when a BFF task touches shared business behavior from `egg-business` or needs to decide whether logic belongs in a BFF service or the shared business package.

## Ownership

- Put reusable cross-service business logic in `egg-business`; keep service-specific orchestration in the BFF repository.
- Before implementing shared behavior inside a BFF service, check whether `egg-business` or an existing Egg plugin already provides it.
- Do not reimplement existing shared capabilities in a BFF service, especially interface/client calls, skey/session helpers, print helpers, table/filter/column helpers, permission helpers, export helpers, or other common platform utilities.
- If a shared capability is missing or incomplete, prefer extending `egg-business` or the owning plugin instead of copying similar code into one BFF service.
- Do not add project-specific request/response shape assumptions to shared helpers unless all callers can support them.
- When changing shared behavior, identify affected BFF services before editing.
- Keep backward compatibility for existing method names, argument order, return shape, and error behavior unless the task explicitly includes migration.

## Existing Shared Capability First

- Search `egg-business`, `egg-dhb-framework`, `egg-dhb-permission`, and nearby BFF usage before adding new common helpers.
- For upstream interface calls, reuse existing shared clients/request helpers when available.
- For skey, login/session, tenant, company, user, or permission context, use the established framework/business helper instead of parsing request state manually.
- For print, table columns, filters, exports, and other platform-style utilities, reuse the shared module or plugin that already owns the behavior.
- If a BFF must temporarily implement service-specific logic, keep it clearly local and record why it is not suitable for `egg-business`.

## Integration

- In each BFF service, follow the established plugin import/config style already used by that repository.
- Verify whether the BFF service consumes a published package version, local link, or workspace dependency before changing code.
- If shared behavior changes require service updates, record each affected service in the task G5/G7 notes.
- Avoid duplicating shared helper logic in individual BFF services.

## Verification

- Test at least one direct shared helper path and one consuming BFF path when behavior changes.
- For risky shared changes, list services that were not locally verified.
