# ADR-001 — Domain and Route Strategy

- Status: accepted
- Date: 2026-07-13

## Context

LazoNube needs stable public, application, administration, API, authentication,
and media URLs without adding cross-origin complexity during V1.

## Decision

Use `lazonube.com` as the canonical domain and redirect `www.lazonube.com` to
it. Marketing, invitations, dashboard, administration, and API share the same
origin at `/`, `/templates`, `/invitation/:slug`, `/app`, `/admin`, and
`/api/v1`. Better Auth uses `/api/auth/**`. Public media uses
`media.lazonube.com`; signed uploads use the native R2 S3 endpoint. Do not add
`api.lazonube.com` during V1.

## Consequences

Cookies and browser requests remain same-origin. Private invitation responses
must never share cache entries across guest contexts.

## Alternatives considered

Separate application and API subdomains were rejected for V1 because they add
CORS, cookie, and deployment complexity without a current benefit.
