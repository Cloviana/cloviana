import 'server-only';

import { env } from '@/config/env';
import { getServerCookies } from '@/lib/api/api-client';

// Stored source is immutable, so these reads travel as cacheable GETs rather than Server Actions,
// which are POSTs the browser can't cache and which run one at a time.
export async function forwardSource(
  slug: string,
  themeId: string,
  path: string,
) {
  const base = process.env.INTERNAL_API_URL || env.API_URL;
  const upstream = await fetch(
    `${base}/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/${path}`,
    { headers: { cookie: await getServerCookies() }, cache: 'no-store' },
  );
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') ?? 'application/octet-stream',
      'cache-control': upstream.headers.get('cache-control') ?? 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
