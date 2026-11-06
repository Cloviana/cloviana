# Customers

Own shoppers inside one marketplace. A `Customer` is created the first time a signed-in user
visits a marketplace (`EnsureCustomerUseCase`), and `StorefrontAuthGuard` turns a marketplace
session into a customer principal.

Implemented: `GET /storefront/me`, and the public `GET /storefront/site` (resolves the request host to the marketplace's name and slug). Carts, addresses and order history are not built yet.
Follow [the coding guide](../../../ARCHITECTURE.md) when adding this feature.
