# Billing

Own Cloviana subscriptions, entitlements, billing-provider references, and webhook processing. This is platform billing; buyer payments and seller payouts belong with `orders`.

This is reserved scaffolding; no Nest module, endpoint, or behavior is implemented.
Follow [the coding guide](../../../ARCHITECTURE.md) when adding this feature.

- `presentation/`: HTTP routes, DTOs, and other inbound transports.
- `application/`: one folder per use case and `ports/` for I/O contracts.
- `domain/`: pure business rules, entities, value objects, and errors.
- `infrastructure/`: persistence/provider adapters and durable workflows.

Wire dependencies in `billing.module.ts` and register that module explicitly
in `src/app.module.ts` when the first feature is implemented.
