# LazoNube

Full-stack digital invitations platform built with Nuxt, Nitro, TypeScript,
Prisma, and PostgreSQL.

## Requirements

- Node.js 24 LTS
- npm 11 or later
- Docker Desktop with Docker Compose

## Local setup

```bash
nvm use
cp .env.example .env
docker compose up -d
npm ci
npm run prisma:generate
npm run db:migrate:deploy
npm run dev
```

The application runs at `http://localhost:3000`. Mailpit is available at
`http://localhost:8025`. PostgreSQL is exposed locally on port `5433` to avoid
conflicting with a system PostgreSQL installation.

Health endpoints:

- `/up`: process availability
- `/health/live`: application liveness
- `/health/ready`: PostgreSQL readiness

Stop local services with `docker compose down`. Use
`docker compose down -v` only when deleting local data is intentional.

## Database commands

```bash
npm run prisma:generate
npm run prisma:validate
npm run db:migrate:dev
npm run db:migrate:deploy
npm run db:seed
```

## Quality and tests

```bash
npm run check:lockfiles
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
npm run worker:build
```

Integration tests require the local PostgreSQL service. E2E tests require a
running built application or development server.

## Branch strategy

Feature branches target `develop`. Release pull requests merge `develop` into
`main`. Hotfixes use `hotfix/*`. Squash merging is preferred.

Read [CLAUDE.md](./CLAUDE.md) before implementing product functionality.
