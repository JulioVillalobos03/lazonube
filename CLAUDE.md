# LazoNube Technical Instructions

Read this file completely before changing the repository.

## Authority and scope

Explicit owner decisions have the highest authority. The repository and CI
setup guide establishes the Phase 0 foundation. The complete product master
specification must be added before Phase 1 starts; do not infer missing product
requirements from this foundation.

## Architecture

- Nuxt 4, Nitro, TypeScript strict mode, and Node.js 24 LTS.
- Prisma 7 with PostgreSQL 18 and the `@prisma/adapter-pg` driver adapter.
- npm is the only package manager.
- Application code, routes, schemas, tests, and technical names are in English.
- Server-only values and database access never enter `app/` or public runtime
  configuration.

## Guardrails

- Do not implement authentication, editor, media, payments, guests, RSVP, or
  check-in during Phase 0.
- Do not expose Prisma records directly as public DTOs.
- Use Zod contracts at trust boundaries.
- Use database migrations; never use `prisma db push` in staging or production.
- Run migrations only from the web pre-deploy flow, never concurrently from the
  worker.
- Do not log secrets, invitation tokens, cookies, passwords, email addresses,
  phone numbers, or complete request bodies.
- Never commit `.env` or production credentials.
- Do not mark a phase approved without explicit owner approval.

## Required review before functional work

Review `package.json`, `nuxt.config.ts`, `prisma.config.ts`,
`prisma/schema.prisma`, the ADRs, and GitHub Actions workflows. State the phase
and files in scope before implementation.
