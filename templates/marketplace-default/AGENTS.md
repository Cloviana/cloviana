# Storefront instructions

This is a Next.js storefront edited only by the Cloviana agent.

- Checkout is a separate hosted page. Never build a checkout, take payments or call a payment provider here; the cart links to Cloviana's checkout.
- Keep the cart route (`app/cart`) in place.
- Use standard Next.js features only (App Router, React Server Components), so the storefront deploys on Vercel without changes.
