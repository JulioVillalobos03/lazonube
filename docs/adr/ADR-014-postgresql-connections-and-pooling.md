# ADR-014 — PostgreSQL Connections and Pooling

- Status: proposed
- Date: 2026-07-16

## Context

Nuxt and the worker will have different runtime connection profiles.

## Decision

Phase 0 uses Prisma's PostgreSQL driver adapter and a development singleton. The
deployment pool sizing policy awaits measured staging behavior.

## Consequences

Connection limits must be configured before production scaling.

## Alternatives considered

Pending.
