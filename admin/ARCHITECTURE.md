# App architecture and coding guide

## Approach

This application uses the Next.js App Router with feature-based product
boundaries. The `app` directory owns URL structure and Next.js file
conventions. The `features` directory owns product behavior. This follows
Next.js guidance for route groups and colocated code, and the feature-module
approach documented by
[Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md).

Do not reproduce the Nest API's `domain`, `application`, and `infrastructure`
layers in the frontend. The important frontend boundaries are route
composition, feature ownership, and the server/client component boundary.

## Directory map

```text
src/
  app/
    (auth)/                       # Authentication URLs; group is omitted from URLs
      login/page.tsx
      signup/page.tsx
    (dashboard)/                  # Signed-in control-plane URLs
      page.tsx
    api/auth/google/callback/      # OAuth callback route handler
    layout.tsx                     # Root document and global providers
  features/
    auth/                         # Sign-in, sign-up, session-facing UI
    marketplaces/                 # Marketplace UI and API calls
    onboarding/                   # New owner activation flow
    memberships/                  # Members, invites, and roles UI
    billing/                       # Cloviana plan and entitlement UI
    profiles/                     # Current user (GET /me)
  components/
    ui/                           # Generic UI primitives, never feature rules
    layout/                       # Shared dashboard shell when introduced
    forms/                        # Shared form workflow pieces, such as the unsaved-changes bar
    feedback/                     # Shared empty, error, and loading UI when introduced
  config/                         # Validated environment and route constants
  hooks/                          # Browser hooks used by multiple features
  lib/
    api/                          # Shared Nest API transport
    platform-auth/                # Better Auth browser client (owners and staff)
  styles/                         # Global CSS and design tokens
  proxy.ts                        # Session refresh and optimistic redirects
```

Route groups such as `(auth)` and `(dashboard)` organize related routes without
becoming part of the URL. A route is public only when its folder contains a
Next.js route file such as `page.tsx` or `route.ts`.

## Where code belongs

| Code                                                             | Location              | Responsibility                                               |
| ---------------------------------------------------------------- | --------------------- | ------------------------------------------------------------ |
| URL, route layout, route loading/error state                     | `app/`                | Compose a page with feature code and Next.js conventions     |
| Product form, panel, table, dialog, action, schema, feature type | `features/<feature>/` | Own one product capability                                   |
| Generic Button, Input, Dialog, table primitive                   | `components/ui/`      | Reusable presentational UI with no product rules             |
| Shared dashboard header or sidebar                               | `components/layout/`  | Cross-feature application shell                              |
| Nest API transport                                               | `lib/api/`            | Request mechanics, session forwarding, common error behavior |
| Platform auth client                                             | `lib/platform-auth/`  | Better Auth browser client for sign-in and sign-up           |
| Environment parsing and URL constants                            | `config/`             | Central configuration                                        |
| Shared browser-only hook                                         | `hooks/`              | Reusable client behavior across features                     |

Create folders inside a feature only when needed. Typical feature contents are
`components`, `actions`, `api`, `schemas`, `hooks`, and `types`; do not create
empty layers by default.

### Large features: slices

A feature that manages several things splits into one slice per thing, each with
the same layers. `features/catalog` has `products/`, `categories/`,
`collections/` and `attributes/`.

- A slice has two entry points. `index.ts` is client-safe (components, hooks,
  query options). `server.ts` holds server-only code (`import 'server-only'`).
  Pages and other slices import only these, never a file inside a slice.
- Dependencies point one way. `products` may use `categories` and
  `attributes`; they never use `products`.
- Inside a slice, `components/` is grouped by screen (`list/`, `form/`,
  `dialogs/`). A hook used by one component sits beside it.
- A file is named after the component it exports in kebab case. List-level
  components are plural (`categories-table`), single items singular
  (`category-row`). Operations are `verb-noun.ts`, with the same name in `api/`
  and `actions/`.

## Server and client boundary

Pages and layouts are Server Components by default. Fetch page data and access
server-only credentials there. Keep `"use client"` at the smallest interactive
component boundary: forms, dialogs, event handlers, local state, effects, and
browser APIs need it.

Do not make an entire route or layout a Client Component just to include one
interactive element. Pass serializable data from a Server Component into a
small Client Component instead.

Mark server-only modules with `import "server-only"` when they access secrets,
cookies, or privileged API behavior. Never import them from a Client Component.

## API, authentication, and authorization

The Nest API is the source of truth for authorization and all marketplace
mutations. A browser request must never supply an owner ID, role, or trusted
marketplace permission. The API derives the authenticated actor from the
platform session cookie and checks membership server-side.

`proxy.ts` refreshes sessions and performs fast redirects only. It is not the
authorization boundary. Verify authorization in server actions, route handlers,
and the Nest API for every protected operation.

Use Server Actions for UI-triggered mutations that need the current session.
Use Route Handlers for browser-facing callbacks, uploads, webhooks, or an
intentional backend-for-frontend endpoint. Do not add generic Next.js proxies
for Nest API routes; Server Components should call the Nest API directly.

## Data fetching: Server Components or React Query

Default to a Server Component that calls a feature `api/` function and renders
the result. Reach for React Query only when the data changes **in the browser
after the page has loaded**.

Use React Query when the UI needs any of: filtering, search, sorting,
pagination or infinite scroll driven by user input; polling or refetch on
demand; optimistic updates; or invalidating a list after a mutation without
navigating. Use a plain Server Component for everything else: detail pages,
layout data (e.g. the current marketplace), and read-only views.

How a React Query feature is wired:

- `features/<f>/api/<thing>.ts`: `server-only` `api` call, as usual.
- `features/<f>/actions/<thing>.ts`: a `'use server'` wrapper used as the
  `queryFn`. The browser never holds the API token, so client reads go through
  the server. Next runs actions one at a time, so debounce search and filter
  input. If that ever becomes a bottleneck, add a dedicated Route Handler.
- `features/<f>/api/<thing>-query-options.ts`: a key factory
  (`['<feature>', slug, 'list', params]`) and `queryOptions()` whose `queryFn`
  is the action. The page and the hook share it, so keys never drift.
- `features/<f>/hooks/use-<thing>.ts` (`'use client'`): `useQuery(...)`.
- The page prefetches with `getQueryClient()` from `lib/react-query/server` and
  wraps the client UI in `HydrationBoundary`.
- Mutations stay Server Actions (see above). The client calls them through
  `useMutation` and invalidates the feature's list key on success.

## Feature rules

- A feature may import shared `components`, `config`, `hooks`, and `lib` code.
- Do not import another feature's internal component, hook, schema, or API
  function. Compose features in `app/`, or expose a deliberately small public
  contract when there is a real shared need.
- Keep marketplace-specific UI inside `features/marketplaces`, even if it is
  used by several marketplace routes.
- Keep server response types separate from UI form types. Validate untrusted
  form input before a mutation.
- Prefer a local state hook first. Add global client state only when multiple
  distant parts of the active interface must coordinate.

## Comments

Use comments for non-obvious intent, security decisions, external constraints,
workarounds, and deliberate trade-offs. Do not comment mechanics that clear
names and structure already explain.

## Adding a feature

For marketplace creation, the eventual implementation would look like:

```text
app/(dashboard)/marketplaces/new/page.tsx
features/marketplaces/
  components/create-marketplace-form.tsx
  actions/create-marketplace.ts
  api/create-marketplace.ts
  schemas/create-marketplace.schema.ts
  types/marketplace.ts
```

1. Add the route page, which composes the feature UI.
2. Keep the interactive form in the owning feature.
3. Validate the form data with a feature schema.
4. Call the Nest API from a server action or feature API function with the
   current session cookie (forwarded by `lib/api`).
5. Let the API derive ownership, generate the marketplace handle, and enforce
   authorization.
6. Redirect or refresh the route only after a successful response.

## Marketplace hosts

The same Next app serves the dashboard and every marketplace. `proxy.ts` decides by host:
`lib/tenant/surface.ts` treats `NEXT_PUBLIC_APP_URL`, `localhost` and `NEXT_PUBLIC_PLATFORM_HOSTS`
as the dashboard; any other host is a marketplace (`<slug>.<platform domain>` or a custom domain).

- Dashboard hosts authenticate with the platform realm (Better Auth, `/api/platform-auth/*`). Marketplace hosts authenticate with the
  marketplace realm (Better Auth), checked by the Nest API, and never run dashboard pages.
- `next.config.mjs` rewrites only `/api/marketplace-auth/*` and `/api/marketplace-auth-handoff/*`
  to the API so the session cookie is set by the marketplace's own host. Set `INTERNAL_API_URL`
  to the API itself, not a proxy that changes `x-forwarded-host`.
- Server calls through `lib/api/api-client.ts` forward the visitor's host and cookies on
  marketplace hosts, so the API can resolve the marketplace.
- `lib/marketplace-auth/client.ts` is the browser client (email/password, magic link, Google).
- Storefront and vendor-panel routes are not built yet; `proxy.ts` is where they get rewritten in.
