# ADR-005 — Public Cache Invalidation

- Status: accepted
- Date: 2026-07-13

## Context

Public invitations need CDN performance while publishing and private guest
contexts require strict isolation.

## Decision

Derived assets use immutable names and long caching. Public invitation DTOs use
an ETag based on `invitationVersionId` and short CDN caching with revalidation.
Publishing, pausing, resuming, or restoring enqueues
`InvalidatePublicInvitationCache`. Private guest contexts never share cache
entries.

## Consequences

Every publication state transition must reliably schedule invalidation and
cache keys must include access context where relevant.

## Alternatives considered

No caching and long-lived mutable invitation caches were rejected.
