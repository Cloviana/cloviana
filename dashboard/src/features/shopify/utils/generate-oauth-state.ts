import { randomBytes } from 'crypto';

export function generateShopifyOAuthState(): string {
  return randomBytes(16).toString('hex');
}
