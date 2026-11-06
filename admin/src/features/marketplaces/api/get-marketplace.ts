import 'server-only';

import { cache } from 'react';

import { ApiError, api } from '@/lib/api/api-client';

import type { Marketplace } from '../types/marketplace';

// null when the marketplace does not exist or belongs to someone else (the API answers 404).
export const getMarketplace = cache(async (slug: string) => {
  try {
    return await api.get<Marketplace>(
      `/marketplaces/${encodeURIComponent(slug)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});
