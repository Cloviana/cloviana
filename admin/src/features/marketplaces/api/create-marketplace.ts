import 'server-only';

import { api } from '@/lib/api/api-client';

import type { Marketplace } from '../types/marketplace';

export function createMarketplace(input: { name: string }) {
  return api.post<Marketplace>('/marketplaces', input);
}
