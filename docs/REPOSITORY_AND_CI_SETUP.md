# Repository and CI Setup

This document records the reproducible Phase 0 configuration for LazoNube.
The authoritative product and architecture rules are in [CLAUDE.md](../CLAUDE.md).

## Local requirements

- Node.js 24 LTS and npm 11 or later.
- Docker Desktop with Docker Compose.
- PostgreSQL is published on local port `5433` because port `5432` may be used
  by a system PostgreSQL installation.

## Reproducible local verification

```bash
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
cp .env.example .env
docker compose up -d
npm ci
npm run prisma:generate
npm run db:migrate:deploy
npm run ci
```

Run `npm run dev` for local development. The expected infrastructure endpoints
are `/up`, `/health/live`, and `/health/ready`.

## Repository policy

- npm and `package-lock.json` are the only package-manager artifacts.
- `main` is the production branch and `develop` is the staging branch.
- Feature, fix, refactor, and chore branches target `develop` through pull
  requests.
- GitHub must protect both permanent branches and require `CI / quality` and
  `E2E / e2e` after their first successful runs.

## CI responsibilities

The CI workflow validates lockfiles, formatting, lint, typecheck, Prisma
formatting and schema validity, OpenAPI, real PostgreSQL integration tests,
Nuxt build, worker build, and production dependency audit. The E2E workflow
starts the built Node server against PostgreSQL 18.

## External configuration pending owner access

- Create the private GitHub repository and set its `origin` remote.
- Push `main` and `develop`, then configure branch rules and environments.
- Create Railway staging with web, worker, cron, and PostgreSQL services.
- Create Sentry, PostHog, Cloudflare, R2, Resend, Google OAuth, and Mercado
  Pago accounts only in their corresponding implementation phases.

The repository contains no provider credentials. Environment-specific secrets
are configured only in the corresponding provider environment.
