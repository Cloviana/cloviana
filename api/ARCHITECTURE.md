# API Architecture

## Purpose

This document defines how the `api` folder should be structured as the NestJS codebase grows. The goal is consistency, strong boundaries, and predictable module design.

Use this as the default for new backend work unless there is a clear reason to do otherwise.

## High-Level Shape

The API is organized into a few top-level areas:

- `src/clients`
  Thin wrappers for external infrastructure clients such as Prisma, Redis, Supabase, Resend, or provider SDKs.

- `src/common`
  Cross-module shared code.
  Examples:
  - guards
  - decorators
  - filters
  - interfaces
  - config
  - constants
  - generic utilities

- `src/infrastructure`
  App-wide runtime infrastructure that is not business-domain specific.
  Examples:
  - messaging
  - health
  - storage

- `src/integrations`
  External third-party integrations with clear provider boundaries.
  Examples:
  - DataForSEO
  - Exa

- `src/modules`
  Product/domain modules.
  Examples:
  - auth
  - audits
  - billing
  - businesses
  - jobs

- `src/workflows`
  Multi-step workflows or orchestrations.
  Workflows are not general modules. They are process-oriented and usually stitch together multiple services or nodes.

## Module Rules

Each module should own one domain concept or one tightly related domain slice.

A module should prefer this structure when complexity justifies it:

- `module-name.module.ts`
- `module-name.controller.ts`
- `dto/`
- `services/`
- `helpers/`
- `queries/`

Not every module needs every folder. Add folders only when they have real purpose.

### Controllers

Controllers should be thin.

Controllers are responsible for:

- route definitions
- request binding
- guards
- passing input to services

Controllers should not:

- contain business logic
- build Prisma queries
- normalize domain data
- orchestrate workflow rules inline

### Services

Services should be split by responsibility when a module grows.

Good splits:

- core resource service
- setup/workflow service
- membership/invite service

Bad split:

- arbitrary file splitting with no responsibility boundary

Use multiple services when one service starts owning multiple concerns.

### Helpers

`helpers/` is for module-local pure support logic.

Examples:

- setup normalization
- setup validation helpers
- deterministic suggestion builders

Helpers should be:

- pure where possible
- business-specific
- free of Nest decorators

Helpers should not hold reusable Prisma `where` fragments, `select`, or `include` objects. Those belong in `queries/`.

Do not put generic app-wide helpers here. Those belong in `src/common`.

### Queries

`queries/` is for reusable Prisma read shapes and query fragments.

Examples:

- `select`
- `include`
- reusable `where`
- reusable `orderBy`

If a file mainly defines how Prisma reads data, it belongs in `queries/`.

## Recommended Naming

Prefer direct names over abstract names.

Examples:

- `BusinessSetupService`
- `BusinessMembersService`
- `business-where.ts`
- `business-setup.ts`
- `business-selects.ts`

Prefer:

- `helpers/` for module-local behavior helpers
- `queries/` for Prisma read/query shapes

Avoid broad catch-all names unless they are actually justified:

- `utils`
- `manager`
- `common`
- `base`

## Business Module Pattern

The `businesses` module is the current reference pattern for a non-trivial module.

Use this split:

- `BusinessesService`
  Core business reads and resource operations

- `BusinessSetupService`
  Setup flow and setup state transitions

- `BusinessMembersService`
  Membership and invite logic

Support files:

- `queries/business-where.ts`
- `helpers/business-setup.ts`
- `queries/business-selects.ts`

This is the preferred pattern when a module contains:

- a core resource
- a workflow/state machine
- access/membership rules

## Workflows

Use `src/workflows` only for real orchestrations.

A workflow is appropriate when:

- there are multiple nodes/steps
- there is cross-service orchestration
- there is retry/state/progress behavior
- the process is not just one service method with a few DB writes

Examples:

- audit execution
- report generation
- async processing pipelines

Do not move normal CRUD or module-local flows into `src/workflows` just because they have several steps.

Business setup is module logic, not a global workflow.

## Authorization

Authorization rules must not drift between guards and services.

If a rule is reused, centralize it in one shared module and consume it from both places.

Examples:

- owner access predicates
- accessible business predicates

Guards should enforce route-level access.
Services should still protect critical access paths if they are callable from multiple places.

## DTO Rules

DTOs should define request contract boundaries only.

DTOs should:

- validate incoming payloads
- stay close to controller input

DTOs should not:

- contain business logic
- substitute for domain rules

If a rule is domain-specific and depends on persisted state, it belongs in a service or helper, not just in DTO validation.

## Direct Create vs Workflow Create

Do not keep multiple public creation paths if they produce inconsistent resource states.

If a module has an official setup flow, that setup flow should usually be the only public creation path unless there is a strong reason for a separate admin/internal shortcut.

If an internal shortcut exists, it must not violate the state model used by the rest of the module.

## Testing Rules

Production modules need tests for the rules most likely to regress.

Do not aim for broad low-signal coverage first. Prefer a few strong tests around:

- access control
- routing decisions
- state transitions
- workflow invariants
- role enforcement

Current API test style:

- use Node's built-in `node:test`
- keep tests small and direct
- mock Prisma/services in memory for unit tests

Use:

- unit tests for domain decisions
- integration tests only when persistence behavior itself is the risk

## What Good Looks Like

A production-ready module should have:

- clear responsibility boundaries
- thin controllers
- typed Prisma query shapes
- centralized authorization predicates when reused
- no dead public endpoints
- no conflicting creation paths
- focused regression tests around critical rules

When in doubt, optimize for:

- fewer hidden rules
- fewer duplicated access predicates
- fewer mixed responsibilities in one service
- simpler, explicit structure
