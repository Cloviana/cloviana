import { createHmac, timingSafeEqual } from 'crypto';

export function verifyCallbackHmac(params: URLSearchParams): boolean {
  const hmac = params.get('hmac');
  if (!hmac) return false;
  const message = Array.from(params.entries())
    .filter(([k]) => k !== 'hmac' && k !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const digest = createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(message)
    .digest('hex');
  return timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

export function verifyWebhook(
  rawBody: Buffer,
  hmacHeader: string | null,
): boolean {
  if (!hmacHeader) return false;
  const digest = createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(rawBody)
    .digest('base64');
  return timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}
