# ADR-010 — PostgreSQL Testing Strategy

- Status: proposed
- Date: 2026-07-16

## Context

Persistence behavior must be tested against PostgreSQL rather than an in-memory
substitute.

## Decision

Integration and E2E workflows use PostgreSQL 18 service containers. Local
integration tests use the PostgreSQL service from Docker Compose.

## Consequences

Persistence tests require a real database and may take longer than unit tests.

## Alternatives considered

SQLite and mocked database clients were rejected for persistence validation.
