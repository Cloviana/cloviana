import 'server-only';

import { api } from '@/lib/api/api-client';

import type { AttributeListParams, AttributePage } from '../types';

export function listAttributes(slug: string, params: AttributeListParams = {}) {
  return api.get<AttributePage>(
    `/marketplaces/${encodeURIComponent(slug)}/attributes`,
    { params: { ...params, isVariantAxis: true } },
  );
}
