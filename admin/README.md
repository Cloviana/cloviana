# Cloviana admin

Cloviana's Next.js App Router application is the web interface for the
Cloviana API. It owns routes, server rendering, browser interactions, and
platform session handling (Better Auth). The Nest API remains the authority for marketplace
authorization, persistence, and billing rules.

Read [ARCHITECTURE.md](ARCHITECTURE.md) before adding a product feature.
Use [UI-COLORS.md](../UI-COLORS.md) for colour tokens and interaction states.

## Structure

```text
src/
  app/                 # URLs, layouts, loading/error boundaries, route composition
    (auth)/            # /login and /signup
    (dashboard)/       # signed-in dashboard routes
    api/auth/          # browser-facing authentication callback
  features/            # product behavior grouped by capability
    auth/
    marketplaces/
    onboarding/
    memberships/
    billing/
    profiles/
  components/ui/       # shared presentational primitives
  config/              # validated environment and route constants
  lib/api/             # shared Nest API transport
  lib/platform-auth/   # Better Auth browser client for owners and staff
  styles/              # global styles and tokens
  proxy.ts             # session refresh and optimistic redirects
```

`auth`, `profiles`, `marketplaces` and `onboarding` have code; `memberships` and `billing`
are reserved boundaries. Their READMEs describe ownership; add code only when implementing
that capability.

## Configuration

Use the pnpm version in `package.json`. Configure the variables shown in
[.env.example](.env.example). For Google OAuth, allow
`<NEXT_PUBLIC_APP_URL>/api/platform-auth/callback/google` as an authorized redirect URI.

Successful signup and login redirect to `/`.
