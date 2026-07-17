# ADR-013 — Transactional Enqueue

- Status: accepted
- Date: 2026-07-13

## Context

A domain transaction and its critical asynchronous effect must not diverge when
the process fails between database commit and queue publication.

## Decision

Use a transactional outbox by default for critical effects. The domain
transaction writes state and an `OutboxEvent`. An idempotent dispatcher creates
the pg-boss job and marks the event published only after enqueue succeeds.
Direct jobs are allowed only when losing the job cannot leave inconsistent
domain state.

## Consequences

Dispatch, retry, locking, retention, and observability are required parts of the
queue runtime.

## Alternatives considered

Uncoordinated commit-then-enqueue was rejected for critical effects.
