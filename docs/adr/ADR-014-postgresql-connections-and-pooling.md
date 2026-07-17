# ADR-014 — PostgreSQL Connections and Pooling

- Status: accepted
- Date: 2026-07-13

## Context

Web, worker, cron, migration, CI, and pg-boss processes share a finite
PostgreSQL connection budget.

## Decision

Prisma 7 uses `@prisma/adapter-pg` and `pg` in the Node runtime. Web and worker
use separate pools with configurable limits. Runtime uses `DATABASE_URL` over
Railway private networking when available. `DIRECT_DATABASE_URL` is reserved
for migrations when required. Replica changes require recalculating the full
connection budget.

## Consequences

Pool settings and service scaling must be reviewed together and monitored in
staging.

## Alternatives considered

Unbounded pools and scaling replicas without connection budgeting were
rejected.
