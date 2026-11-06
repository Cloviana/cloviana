# Business modules

Read [the architecture and coding guide](../../ARCHITECTURE.md) before adding
or moving backend code. It documents the full directory map, dependency rules,
use cases, ports, adapters, Nest registration, and background workflows.

Some module directories are implemented (marketplaces, platform-users, onboarding,
customers, vendors); the rest reserve product boundaries and have no active
providers or endpoints yet. Implement a module when its product feature is
requested, then register its Nest module explicitly in `src/app.module.ts`.

Keep feature internals private. Share an intentionally exported facade or
contract through a Nest module, and keep vendor-specific details in adapters.
