# Vendors

Own marketplace members and sellers: vendor sign-in (`Member`), invite acceptance, and the
seller-side operations that follow. Authentication is the marketplace-realm Better Auth login
(see `platform/auth/marketplace`); this module decides who is an active member of which seller.

Implemented: `GET /vendor/me`, `POST /vendor/invites/accept`, and the owner-side
`GET`/`POST`/`PATCH /marketplaces/:slug/sellers` (create a store with its owner invite, list stores
with a total, bulk status/featured update) and `POST /marketplaces/:slug/sellers/:sellerId/invites`
(resend the invite). Roles and store detail are not built yet.
Follow [the coding guide](../../../ARCHITECTURE.md) when adding this feature.
