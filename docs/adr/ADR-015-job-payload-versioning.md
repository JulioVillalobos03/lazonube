# ADR-015 — Job Payload Versioning

- Status: accepted
- Date: 2026-07-13

## Context

Persistent jobs can remain queued while web and worker deployments transition
between releases.

## Decision

Every persistent job includes an integer `jobVersion`. Processors support the
current and at least the previous compatible version. Incompatible changes use
a new job name or version. Old processors remain until no pending jobs require
them.

## Consequences

Deployments tolerate a brief mixed-version window and job retirement requires
queue inspection.

## Alternatives considered

Unversioned payloads and immediate removal of previous processors were rejected.
