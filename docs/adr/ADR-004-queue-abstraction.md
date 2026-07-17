# ADR-004 — Queue Abstraction

- Status: accepted
- Date: 2026-07-13

## Context

Asynchronous work must be durable without introducing Redis prematurely or
coupling domain services to a queue vendor.

## Decision

Use pg-boss over PostgreSQL behind a `QueueClient` interface. Payloads contain
`jobVersion`, `correlationId`, and minimal identifiers. Processors live in a
registry separate from use cases.

## Consequences

PostgreSQL connection and workload budgets include the queue. Moving to Redis
or BullMQ requires metrics and a replacement ADR.

## Alternatives considered

In-memory jobs were rejected as non-durable. Redis/BullMQ was deferred until
measurements justify the additional service.
