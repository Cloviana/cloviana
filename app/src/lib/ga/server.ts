import 'server-only';

import { env } from '@/config/env';

export async function gaServerEvent(
  userId: string,
  name: string,
  params?: Record<string, any>,
) {
  const body = {
    user_id: userId,
    events: [{ name, params: params || {} }],
  };

  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${env.GA4_ID}&api_secret=${process.env.GA4_API_SECRET}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    },
  );
}
