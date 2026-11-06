'use client';

import { createAuthClient } from 'better-auth/react';

// Owners and staff sign in on the admin host. next.config.mjs rewrites /api/platform-auth/* to
// the Nest API, so the session cookie belongs to this host.
export const platformAuth = createAuthClient({
  basePath: '/api/platform-auth',
});
