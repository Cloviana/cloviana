# Catalog

Own the marketplace's master catalog: products, variants, categories, collections, tags, attributes, and seller offers (models are in `prisma/schema.prisma`).

Implemented so far: products (list, get, create) under `marketplaces/:slug/products`.
Follow [the coding guide](../../../ARCHITECTURE.md) when adding this feature.

- `presentation/`: HTTP routes, DTOs, and other inbound transports.
- `application/`: one folder per use case and `ports/` for I/O contracts.
- `domain/`: pure business rules, entities, value objects, and errors.
- `infrastructure/`: persistence/provider adapters and durable workflows.

Wire dependencies in `catalog.module.ts` and register that module explicitly
in `src/app.module.ts` when the first feature is implemented.
