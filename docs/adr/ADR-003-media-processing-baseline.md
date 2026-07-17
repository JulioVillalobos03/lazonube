# ADR-003 — Media Processing Baseline

- Status: accepted
- Date: 2026-07-13

## Context

User media must be private until it is decoded, sanitized, and transformed by a
resource-isolated process.

## Decision

Sharp processes images in the worker. Originals are limited to 12 MB and
12,000 × 12,000 pixels. Initial outputs are AVIF and WebP with fallback when
needed, using `cover-1600`, `gallery-1200`, and `thumb-400` variants. Processing
removes EXIF and geolocation. Media concurrency starts at two. FFmpeg is
installed only in workers that process audio.

## Consequences

Originals remain private, HTTP requests do not perform heavy processing, and
worker CPU and memory must be monitored.

## Alternatives considered

Processing in Nitro requests and publishing originals directly were rejected.
