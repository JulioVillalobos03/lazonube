# ADR-011 — Better Auth and MFA

- Status: accepted
- Date: 2026-07-13

## Context

LazoNube needs password, OAuth, persistent sessions, recovery, verification,
and stronger controls for platform administrators.

## Decision

Integrate Better Auth through Nitro and its Prisma adapter. Generate and review
the user, session, account, and verification models before the first migration.
Enable email/password and Google OAuth in Phase 1. Store sessions in PostgreSQL
and expose them only through `httpOnly` cookies. Keep platform roles in the user
domain. Require MFA for administrative roles before production and a recent
session for sensitive changes.

## Consequences

Better Auth handles authentication while module policies remain responsible for
authorization. Adapter schema compatibility must be reviewed on upgrades.

## Alternatives considered

Custom authentication and browser-stored bearer tokens were rejected.
