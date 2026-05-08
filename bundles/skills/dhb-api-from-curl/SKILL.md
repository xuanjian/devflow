---
name: dhb-api-from-curl
description: Use when the user provides a curl request and wants DHB Taro request code, a mock file, or both.
---

# DHB API From Curl

Use this skill for curl-driven API work in DHB front-end packages.

## Inputs

- Full curl command.
- Target mode: request code, mock data, or both. If unclear, infer from user wording and ask only when output location is ambiguous.
- Target package/module when not clear from the current project.

## Flow

1. Parse URL, method, headers, query, and body.
2. Classify service:
   - `*.newdhb.com` / `*.dhb168.com` standard PHP API or BFF by host name.
   - BFF hosts map to existing `bffXxxTaroRequest` helpers when present.
3. For request code, generate the smallest wrapper matching nearby service files.
4. For mock data, execute curl only when safe and useful; otherwise use the provided response body.
5. Update mock config only when the target project already has a mock config pattern.

## Output Rules

- Do not invent a new request framework.
- Match existing import style and folder naming.
- Keep generated mock data realistic but compact.
- Redact tokens, cookies, and private headers before writing files.

Historical detailed notes:

- `docs/reference/skills/dhb-packages/create-api-request.md`
- `docs/reference/skills/dhb-packages/mock-api-from-curl.md`
