# ADR-012 — ULID Strategy

- Status: accepted
- Date: 2026-07-13

## Context

Business entities need opaque, sortable identifiers that are safe to expose as
references but never treated as authorization.

## Decision

Business entities use `String @id @default(ulid()) @db.VarChar(26)` and foreign
keys use `String @db.VarChar(26)`. Better Auth may retain an adapter-required ID
format when necessary and the exception must be documented. Do not mix UUID,
autoincrement, and ULID within a module without justification.

## Consequences

Database columns and API contracts use 26-character ULIDs for domain entities.
Policies remain mandatory for every protected lookup.

## Alternatives considered

Sequential IDs and a mixture of unrelated identifier formats were rejected.
