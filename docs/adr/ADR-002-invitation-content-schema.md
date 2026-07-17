# ADR-002 — Invitation Content Schema

- Status: accepted
- Date: 2026-07-13

## Context

Editable presentation must be versioned without duplicating operational event,
guest, RSVP, order, or payment data.

## Decision

`InvitationVersion.contentJson` stores a versioned, Zod-validated discriminated
union of semantic sections. Each section has a stable ULID, registered
`rendererKey`, enabled state, order, validated content, and limited settings.
Media is referenced by `assetId`. Operational dates and segments are resolved
from the Events domain while assembling the public DTO. HTML, JavaScript, Vue
components, Tailwind classes, and unsanitized URLs are forbidden.

## Consequences

Incompatible changes require a new `schemaVersion` and explicit migrator.
Template changes can preserve compatible semantic content.

## Alternatives considered

Arbitrary HTML and duplicating the complete public DTO in JSON were rejected
for security and consistency reasons.
