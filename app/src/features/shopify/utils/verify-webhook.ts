import { createHmac, timingSafeEqual } from 'crypto';

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
