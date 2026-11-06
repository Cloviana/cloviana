# Marketplaces

Own marketplace records, names, slugs/domains, settings, and lifecycle. Creating a marketplace is database rows only: the marketplace (created `ACTIVE`), an `Admin` role, a default commission rate and its order-number sequences, in one transaction (`domain/marketplace-defaults.ts`). Custom-domain verification is the one asynchronous operation.

Implemented: `POST /marketplaces`, `GET /marketplaces`, `GET /marketplaces/:slug` (owner only; a marketplace you don't own returns 404). Settings, domains and lifecycle changes are not built yet.
Follow [the coding guide](../../../ARCHITECTURE.md) when adding this feature.

- `presentation/`: HTTP routes, DTOs, and other inbound transports.
- `application/`: one folder per use case and `ports/` for I/O contracts.
- `domain/`: pure business rules, entities, value objects, and errors.
- `infrastructure/`: persistence/provider adapters and durable workflows.

Wire dependencies in `marketplaces.module.ts` and register that module explicitly
in `src/app.module.ts` when the first feature is implemented.
