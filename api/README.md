# Cloviana API

NestJS/Fastify backend organized as a modular monolith. Business capabilities
live in `src/modules`, shared runtime services in `src/platform`, and external
provider clients in `src/integrations`.

Start with [the architecture and coding guide](ARCHITECTURE.md). It explains
where code belongs, dependency rules, module registration, ports/adapters,
background jobs, and how to implement a feature. The primary reference is
[Sairyss/domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon).

## Current implementation

- `platform/auth`: Better Auth session guard (platform users), public-route metadata, and the
  current-user decorator. Routes require authentication unless marked `@Public()`.
- `platform/auth/marketplace` and `platform/tenancy`: Better Auth for vendors and shoppers,
  host-to-marketplace resolution, and Row Level Security scoping.
- `platform`: configuration, Prisma, Redis/cache, health, and Inngest support.
- `integrations`: Exa, OpenRouter, and Resend clients.
- `modules`: marketplaces, platform-users, onboarding, customers and vendors have routes. The other
  module directories (memberships, billing, catalog, orders) are documented scaffolding.

Existing route:

| Route | Access | Purpose |
| --- | --- | --- |
| `GET /api/health` | Public | Basic process liveness response |

Token validation alone does not grant access to a marketplace. See the guide
for future membership checks.

## Configuration and development

Use Node.js 22.12+ (or 24+) and the pnpm version in `package.json`. Copy
`.env.example` to `.env` and configure local services. The database is Neon Postgres 18: set
`DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in `.env`.

From the repository root, the existing Compose setup can start the other
local services:

```sh
docker compose -f docker/compose-core.yaml -f docker/compose-dev.yaml up -d redis inngest nginx
```

From `api/`, install dependencies, generate Prisma's client, and start the API:

```sh
pnpm install
pnpm db:generate
pnpm start:dev
```

In development the API, admin and web run on the host; Docker only
runs redis, Inngest and the dev nginx. Production-only services are in
`docker/compose-prod.yaml`.

Configuration is in `src/platform/config/app.configuration.ts` using the
existing Configify setup. Exa, OpenRouter, and Resend credentials are optional
at boot and required when their clients are used. Provider modules must be
imported explicitly by modules that consume them.

## Database changes

`prisma/schema.prisma` currently contains `PlatformUser`. Prisma 7 CLI connections
are configured in `prisma.config.ts`: `DIRECT_URL` takes precedence over
`DATABASE_URL`. Runtime Prisma queries use `DATABASE_URL` and the PostgreSQL
adapter in `src/platform/database/prisma`.

From `api/`, apply existing pending migration files with:

```sh
pnpm migrate:deploy
```

For a new schema change against a development database:

```sh
pnpm migrate:dev --name describe_change
pnpm db:generate
```

Keep SQL-only database features in version-controlled migrations. `PlatformUser` is
the Better Auth platform user, so Better Auth creates it at sign-up.
Do not edit migration files already applied to a shared database; add a new
migration. Resolve existing tables or migration-history conflicts deliberately
before applying a fresh migration history to an older database.

## Background work

Inngest's shared client and event sender are in `src/platform/jobs/inngest`.
There are currently no registered feature functions or active worker connection.
When implementing a workflow, follow [the guide](ARCHITECTURE.md#background-work)
for feature ownership, durable execution, retries, and registration.
