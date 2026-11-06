import type { NextRequest } from 'next/server';

import { env } from '@/config/env';
import { getServerCookies } from '@/lib/api/api-client';

// The browser's EventSource can't go through a Server Action and needs the session the Next server
// holds, so this one route streams the agent's run through to the page. The Nest API authorizes it.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; runId: string }> },
) {
  const { slug, runId } = await params;
  const base = process.env.INTERNAL_API_URL || env.API_URL;
  const lastEventId = request.headers.get('last-event-id');

  const upstream = await fetch(
    `${base}/marketplaces/${encodeURIComponent(slug)}/assistant/runs/${encodeURIComponent(runId)}/stream`,
    {
      headers: {
        accept: 'text/event-stream',
        cookie: await getServerCookies(),
        ...(lastEventId ? { 'last-event-id': lastEventId } : {}),
      },
      cache: 'no-store',
      signal: request.signal,
    },
  );
  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
    },
  });
}
