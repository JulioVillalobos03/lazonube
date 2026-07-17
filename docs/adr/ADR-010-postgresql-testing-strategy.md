# ADR-010 — PostgreSQL Testing Strategy

- Status: accepted
- Date: 2026-07-13

## Context

Transactional rules, PostgreSQL constraints, indexes, and concurrency behavior
cannot be validated reliably with a different database engine.

## Decision

Local and CI integration tests use PostgreSQL 18. GitHub Actions uses the
`postgres:18-alpine` service image. Integration tests apply real migrations.
Concurrency tests use real transactions and separate connections. SQLite is not
used as a persistence substitute.

## Consequences

Integration suites require PostgreSQL and take longer than isolated unit tests.

## Alternatives considered

SQLite and mocked Prisma clients were rejected for persistence validation.
