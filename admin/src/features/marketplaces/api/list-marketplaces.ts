import 'server-only';

import { cache } from 'react';

import { api } from '@/lib/api/api-client';

import type { Marketplace } from '../types/marketplace';

export const listMarketplaces = cache(() =>
  api.get<Marketplace[]>('/marketplaces'),
);
