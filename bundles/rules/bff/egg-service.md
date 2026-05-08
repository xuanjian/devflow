# BFF Egg Service Rules

Use this rule when editing DHB BFF service repositories such as `bff-goods`, `bff-order`, `bff-user`, `bff-warehouse`, `bff-payment`, or `bff-hub`.

## Service Boundary

- Keep HTTP entry logic in Controller classes and business orchestration in Service classes.
- Use the existing `@eggjs/tegg` Controller pattern from nearby files: `@HTTPController`, `@HTTPMethod`, `@Context`, `@HTTPBody`, `@HTTPQuery`, `@HTTPQueries`, `@Inject`, and existing middleware/decorator style.
- Keep request parameter normalization, validation, and permission assumptions explicit near the entry point.
- Do not move shared business behavior into a single BFF service when it belongs in `egg-business` or a framework/plugin layer.
- Preserve existing response envelope, error code, and logging patterns from nearby code.

## Controller Comments And Swagger

- New or changed public Controller methods must keep Swagger-friendly comments above the `@HTTPMethod` decorator.
- At minimum, document `@summary`; add `@description` when the endpoint has business rules, async behavior, permissions, side effects, or non-obvious field meaning.
- For body requests, use a named TypeScript request type with `@HTTPBody()` and document it with `@request_body {RequestType} request - description`.
- For query requests, keep query names/types visible through `@HTTPQuery()` / `@HTTPQueries()` and add inline parameter comments when nearby code uses that pattern.
- Document responses with `@response 200 {ResponseType} description`; avoid vague `{any}` for new endpoints unless the existing API contract is genuinely dynamic.
- Keep Controller/group comments such as `@controller` or `@tag` consistent with nearby modules so generated Swagger grouping remains useful.
- If an API path, method, request type, or response type changes, update the Controller comment in the same change.
- Do not leave stale Swagger comments after refactoring a method name, route path, request body, or response model.

## Swagger Generation

- These BFF repositories commonly generate Swagger through `@typescript-generate-swagger/swagger-tegg` and `swaggerDoc/runswagger.js`.
- When adding or changing API contracts, run the repo's script when available: `npm run build-swagger-doc`.
- If the release/build script already calls Swagger generation, such as `tsc-server`, keep that behavior working.
- The generated output is normally `docs/swagger-node-api.json`; verify whether the target repo expects this file to be updated or copied into `dist`.
- If Swagger generation fails, fix missing exported types, invalid comment tags, or unresolved imports before bypassing the script.
- Do not hand-edit generated Swagger JSON unless the repo explicitly documents that workflow.

## Upstream And Data

- Before changing field meaning, verify the source in upstream service, existing BFF usage, and frontend/native callers.
- Do not rename or reinterpret business fields only from UI wording.
- Guard empty arrays, null objects, timeout results, and partial upstream responses before mapping to clients.
- Keep Redis/cache keys, TTLs, and invalidation behavior compatible with nearby code.

## Implementation

- Reuse existing helpers, base classes, decorators, and service clients before adding new plumbing.
- Keep domain model conversion close to the service method that owns it.
- Add logs around external calls and failure branches when the surrounding module already logs similar cases.
- Prefer small endpoint-level tests or minimal reproduction commands for high-risk behavior.
