'use client';

import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// Vendors and shoppers sign in on the marketplace's own host. next.config.mjs rewrites
// /api/marketplace-auth/* to the Nest API, so the session cookie belongs to that host.
const BASE_PATH = '/api/marketplace-auth';

function create() {
  return createAuthClient({
    baseURL: `${window.location.origin}${BASE_PATH}`,
    plugins: [magicLinkClient()],
  });
}

let client: ReturnType<typeof create> | undefined;

export function getMarketplaceAuth() {
  client ??= create();
  return client;
}

/** Starts Google sign-in through the shared auth domain and returns to `next` on this host. */
export function signInWithGoogle(next = '/') {
  const params = new URLSearchParams({ provider: 'google', next });
  window.location.assign(`/api/marketplace-auth-handoff/start?${params}`);
}
