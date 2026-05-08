# egg-dhb-framework Rules

Use this rule when a task touches `egg-dhb-framework`, framework base classes, middleware, request context, permission plumbing, or BFF framework integration.

## Framework Boundary

- Treat framework changes as cross-service changes. Identify known consumers before editing.
- Keep Controller/Service base class behavior backward compatible unless the task includes a migration plan.
- Do not put domain-specific business rules in `egg-dhb-framework`; use BFF services or `egg-business` for domain behavior.
- Keep authentication, permission, tenant, locale, and request context behavior explicit and compatible with existing middleware order.

## Plugin Integration

- Follow each BFF service's existing Egg plugin registration and config pattern.
- When adding plugin config, document required config keys and safe defaults.
- Keep middleware order stable unless the change is specifically about request lifecycle.
- Avoid changing public helper names, context properties, or decorators without updating all consumers.

## Verification

- Validate one framework-level path and one consuming BFF service path when possible.
- For dependency or build failures, inspect package resolution and lockfile behavior before changing Docker or deployment config.
