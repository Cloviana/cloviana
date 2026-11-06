# API architecture and coding guide

## Reference and approach

This API follows a modular monolith with inward dependencies, using
[Sairyss/domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon)
as its primary architecture reference. In particular, follow its guidance on
[modules](https://github.com/Sairyss/domain-driven-hexagon#modules),
[application services](https://github.com/Sairyss/domain-driven-hexagon#application-services),
[ports](https://github.com/Sairyss/domain-driven-hexagon#ports), and
[folder structure](https://github.com/Sairyss/domain-driven-hexagon#folder-and-file-structure).

Our adaptation uses explicit `presentation`, `application`, `domain`, and
`infrastructure` directories inside each business module. Use cases still
get their own folders, as in Sairyss's vertical slices. This is an adaptation
of the reference, not a copy of its exact directory names or framework stack.
We retain Prisma, Configify, Fastify, Better Auth, and Inngest.

Nest modules compose dependencies. Domain code expresses business rules.
Controllers, persistence, and vendor SDKs adapt the outside world to those
rules.

## Directory map

```text
api/
  prisma/
    schema.prisma
    migrations/                    # Version-controlled schema and SQL features
  prisma.config.ts
  src/
    main.ts                        # HTTP bootstrap and global HTTP behavior
    app.module.ts                  # Explicit application composition
    platform/
      config/                      # Configify environment configuration
      auth/                        # JWT guard, user contract, decorators
        platform/                  # Better Auth (owners and staff)
        marketplace/               # Better Auth (vendors and shoppers), session service
      tenancy/                     # Host -> marketplace resolver, RLS-scoped Prisma runner
      database/prisma/             # Connection/client lifecycle
      http/filters/                # HTTP error mapping
      cache/                       # Shared cache operations
        redis/                     # Redis-backed cache setup
      jobs/inngest/                # Client and shared event sender
      health/                      # Liveness route
    integrations/
      cloudflare-r2/
      daytona/
      docker/
      exa/
      opencode/
      openrouter/
      resend/
      sandbox/
      stripe/                      # Reserved integration boundary
    modules/
      marketplaces/                # Implemented: create and list marketplaces
      platform-users/              # Implemented: current user (GET /me)
      onboarding/                  # Implemented: first-run completion
      customers/                   # Implemented: storefront sign-in -> customer
      vendors/                     # Implemented: vendor sign-in, invite acceptance
      catalog/                     # Implemented: products, categories, collections, attributes
      files/                       # Implemented: marketplace media library
      themes/                      # Implemented: theme provisioning and editor workspace
      agents/                      # Implemented: assistant, coding runs, and events
      memberships/                 # Reserved product boundaries below
      billing/
      orders/
```

The reserved modules (`memberships`, `billing`, and `orders`) have layer placeholders and responsibility READMEs, not
working features. Add Nest modules and providers when implementing behavior.
Observability code such as request logging, tracing, and metrics belongs in
`platform/observability` when introduced; it is not implemented by this refactor.

## Where code belongs

| Code | Location | Responsibility |
| --- | --- | --- |
| Controller, resolver, webhook receiver | `modules/<feature>/presentation/` | Translate transport requests into application inputs |
| Request/response DTO | `presentation/http/dto/` | Validate and describe the external API contract |
| One product operation | `application/<operation>/<operation>.use-case.ts` | Coordinate domain rules, persistence, and side effects |
| Repository or external-service contract | `application/ports/*.port.ts` | Describe what the use case needs in product terms |
| Entity, value object, policy, domain error | `domain/` | Enforce rules without database, HTTP, or SDK dependencies |
| Prisma repository, mapper, provider adapter | `infrastructure/` | Implement ports and translate external data |
| Workflow/job transport handler | `infrastructure/workflows/<operation>/` | Connect durable execution to the module's use case |
| Nest wiring and public exports | `<feature>.module.ts` | Bind ports to adapters and expose chosen capabilities |
| Shared database connection | `platform/database/prisma/` | Provide the Prisma client; feature queries stay in their module |
| Environment setting | `platform/config/` | Parse and validate configuration at startup |
| Shared HTTP filter/interceptor | `platform/http/` | HTTP behavior shared by feature endpoints |
| Provider SDK/client and response types | `integrations/<provider>/` | Authentication, transport, provider-specific errors and types |
| Database model/trigger/index | `prisma/` | Persist database changes through migrations |

Keep helpers beside their owner. A helper becomes shared platform code only
when multiple domains truly need it and it does not encode one domain's rules.

## Dependency rules

```text
presentation ---> application ---> domain
                         |
                         v
                   application ports
                         ^
                         |
infrastructure adapters -+-----> platform / integrations
```

- `domain` imports its own types and pure helpers. It does not import Nest,
  Prisma, HTTP DTOs, providers, platform services, or another module's internals.
  A pure library with no framework or I/O dependencies is acceptable.
- `application` imports domain objects and port contracts. Keep transport and
  vendor types out of its inputs/results. Nest DI decorators are allowed here,
  following Sairyss's pragmatic example; HTTP exceptions are not domain errors.
- `presentation` validates input, obtains the authenticated actor, invokes a
  use case, and maps its result/errors to HTTP. Avoid database/SDK calls here.
- `infrastructure` implements application ports using Prisma, provider clients,
  or job infrastructure. Convert Prisma/SDK records into the inner layer's
  types before returning them. Never return Prisma entities as API contracts.
- `platform` and `integrations` do not import business modules. Product-specific
  adapters live inside the module that owns the port.
- Cross-module calls use a deliberately exported facade/contract and explicit
  Nest module imports. Do not import another module's repository, controller,
  domain implementation, or private use case.

These are coding conventions, not automated lint rules in this change.

## Comments

Use comments to explain non-obvious intent, external constraints, security
decisions, workarounds, and deliberate trade-offs. Do not comment code that
clear names and structure already explain.

## Authentication boundary

Session verification is separate: `platform/auth/guards/platform-auth.guard.ts`
resolves the Better Auth session cookie and attaches `{ sub, email }` to the request.
It does not load users or decide marketplace permissions. `@Public()` skips
this guard, and `@CurrentUser()` retrieves the validated request user.

## Two identity realms and tenancy

Two kinds of people sign in, and they never share a user table.

| Realm | Who | Auth | Guard | Routes |
| --- | --- | --- | --- | --- |
| Platform | Marketplace owners, Cloviana staff | Better Auth (`PlatformUser`) | `PlatformAuthGuard` (global) | everything not listed below |
| Marketplace | Vendors (`Member`), shoppers (`Customer`) | Better Auth (`MarketplaceUser`) | `StorefrontAuthGuard`, `VendorAuthGuard`, `MarketplaceSessionGuard` | `/storefront/*`, `/vendor/*`, `/marketplace-auth/*` |

Marketplace-realm routes opt out of the global platform guard with `@Public()` (the
`StorefrontRoute`, `VendorRoute` and `MarketplaceSessionRoute` decorators do this) and use their
own guard, which produces `request.principal`: `{ kind: 'customer' | 'member', marketplaceId, ... }`.

- **Tenant from the host.** `TenantResolverService` maps `<slug>.<PLATFORM_BASE_DOMAIN>` or a
  verified `MarketplaceDomain` to a marketplace. It reads `x-forwarded-host` before `host`,
  because the app forwards marketplace-auth requests with a rewrite. Never take a tenant from a
  request body or a client-supplied id.
- **What platform may know about a tenant.** The marketplace is the tenant, so platform may read
  `marketplaces` and `marketplace_domains` (read-only) to turn a host into
  `{ marketplaceId, slug, name, status }` and to refuse suspended or archived marketplaces.
  Nothing else about a tenant belongs in platform. Plan and feature rules (limits, entitlements)
  live in the `billing` module, which exposes a question such as "can marketplace X use feature
  Y?" that guards and use cases in other modules ask. Platform never learns what a plan is.
- **One login, many marketplaces.** `MarketplaceUser` is shared; each marketplace only sees its own
  `Member` / `Customer` row (`unique(marketplaceId, marketplaceUserId)`). A `Customer` is created on a
  shopper's first visit; a `Member` is created by accepting an invite.
- **Row Level Security.** Code reachable from a storefront or vendor route reads and writes
  through `TenantPrismaService.run(marketplaceId, tx => ...)`. It switches to the
  `cloviana_tenant` role and sets `app.marketplace_id` for that transaction, so Postgres filters
  every tenant table even if a query forgets its `WHERE`. Platform code uses `PrismaService`.
- **Adding a tenant table.** Give it a `marketplaceId` column, reference parents with a composite
  `(marketplaceId, id)` key, and write a migration that enables RLS and the `tenant_isolation`
  policy (copy the loop in `20261016124000_tenant_constraints_and_rls`). Check with
  `SELECT * FROM public.tenant_tables_missing_rls()`; it must return no rows.
- **Social sign-in.** Google only accepts pre-registered redirect URIs, so OAuth runs on one
  shared auth domain (`MARKETPLACE_AUTH_URL`) and hands the session back to the marketplace host
  with a one-time token and a nonce cookie. See `marketplace-auth-handoff.controller.ts`.
- **Email and password** accounts require a verified email; magic links are enabled.

## Adding a feature

For example, implementing marketplace creation would use:

```text
modules/marketplaces/
  marketplaces.module.ts
  presentation/http/
    marketplaces.controller.ts
    dto/create-marketplace.dto.ts
    dto/marketplace.response.dto.ts
  application/
    create-marketplace/
      create-marketplace.use-case.ts
    ports/
      marketplace.repository.port.ts
  domain/
    marketplace.entity.ts
    marketplace.errors.ts
  infrastructure/
    persistence/prisma-marketplace.repository.ts
```

1. Define the action, actor, permissions, result, and domain invariants.
2. Add database fields/migrations only when this feature needs persistence.
3. Write pure domain rules, then the use case coordinating them. Keep one
   application operation per folder; commands change state, queries read it.
4. Define narrowly scoped ports for the use case's I/O needs. Ports describe
   product operations, not the Prisma or a provider SDK surface.
5. Implement the ports in the module's infrastructure and map persistence and
   provider values to domain/application types.
6. Add the controller and DTOs, with explicit authorization for the actor.
7. Bind providers in the feature's Nest module. Import that module explicitly
   in `src/app.module.ts`; do not use `Object.values` registries or barrels to
   automatically register providers.
8. Put unit tests beside the policy/use case and integration tests beside the
   adapter when adding tests. HTTP end-to-end scenarios belong in `test/`.

Do not create entities for trivial data containers or add generic base
repositories, command buses, CQRS, or event sourcing by default. Introduce
those patterns when a feature needs them.

## Ports and Nest dependency injection

An interface is erased at runtime. Pair it with an injection token and bind
that token to an adapter in the owning module. Illustrative example for a
future marketplace feature:

```ts
// application/ports/marketplace.repository.port.ts
import type { Marketplace } from '../../domain/marketplace.entity';

export const MARKETPLACE_REPOSITORY = Symbol('MARKETPLACE_REPOSITORY');

export interface MarketplaceRepositoryPort {
  save(marketplace: Marketplace): Promise<void>;
}

// application/create-marketplace/create-marketplace.use-case.ts
@Injectable()
export class CreateMarketplaceUseCase {
  constructor(
    @Inject(MARKETPLACE_REPOSITORY)
    private readonly marketplaces: MarketplaceRepositoryPort,
  ) {}
  // execute(input) coordinates the domain operation and persistence.
}

// marketplaces.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [MarketplacesController],
  providers: [
    CreateMarketplaceUseCase,
    {
      provide: MARKETPLACE_REPOSITORY,
      useClass: PrismaMarketplaceRepository,
    },
  ],
})
export class MarketplacesModule {}
```

The example omits ordinary imports and operation bodies. Import provider
modules (for example `ResendModule`) into the feature module that owns an
adapter using them. Importing a non-global module into `AppModule` does not
make its services available to sibling modules. Vendor modules are explicitly
scoped; existing global runtime facilities are Prisma, cache, and
Inngest. Keep global providers limited to shared runtime needs.

Use `@/` consistently: it maps only to `src/`. Use relative imports within a
module and direct paths for platform/integration modules. If another feature
needs a capability, export an intentional facade from the owning Nest module,
not every provider. Avoid circular imports and adding `forwardRef` to hide
unclear ownership.

## Marketplace boundaries

- `marketplaces`: marketplace records, settings, slugs/domains, and lifecycle.
- `memberships`: marketplace ownership, roles, invitations, and authorization.
- `billing`: platform subscriptions, entitlements, invoices, and billing webhooks.
- `vendors`, `catalog`, `orders`: the commerce engine. Cloviana owns it directly, so these
  modules hold the real data and rules (the models live in `prisma/schema.prisma`); there is
  no external commerce platform behind them. Creating a marketplace is just database rows
  (plus its defaults, in one transaction), so there is no provisioning step.

The backend manages many marketplaces per user. Future marketplace-owned
records and operations must be scoped to a marketplace, with membership
verified server-side. Never trust a caller-supplied marketplace ID without
checking authorization. Platform code using `PrismaService` needs explicit scope
on every query, because that connection bypasses Row Level Security; marketplace-realm code
uses `TenantPrismaService` (see "Two identity realms and tenancy"). Workers must carry and
validate the necessary tenant/actor context too.

## Background work

Shared Inngest setup lives in `platform/jobs/inngest`. Business use cases own
what work means; a workflow adapter owns how it is scheduled and retried.
Provider-specific calls stay in `integrations` behind the feature's ports.

Keep a workflow, its steps, event schemas, and prompts under the owning module's
`infrastructure/workflows/<operation>/`. Register workflow providers in that
feature's Nest module. When adding the first function, explicitly wire its
function into an Inngest worker connection at the composition/bootstrap layer
and close that connection on shutdown. The retained client/sender currently
has no connected functions; adding a file does not start a worker.

For long-running work such as custom-domain verification, persist pending
status, enqueue durable work, and return an ID/status to the caller. Make steps idempotent, track failures,
and use an outbox or equivalent durable handoff when a database write and
job publication must succeed together. An in-memory event emitter alone does
not guarantee delivery across process failures. Billing webhooks likewise
need signature validation and duplicate-event handling.

## Errors, configuration, and data

Domain errors describe business failures without HTTP status codes. Map those
errors at the presentation boundary. The existing global exception filter in
`platform/http/filters` remains responsible for HTTP error formatting and
unexpected failures; add mappings deliberately when introducing domain errors.

Keep environment names and provider credentials in platform configuration.
Pass only relevant values/ports inward; domain functions must not read
`process.env` or construct SDK clients. HTTP DTO validation checks request
shape; domain rules must still protect invariants for jobs and other callers.

Schema and SQL-only behavior belong in version-controlled Prisma migrations.
`PlatformUser` is the Better Auth platform user, created at sign-up. Do not
add controller-side profile creation. For commands and configuration,
see [the API README](README.md).
