import 'server-only';

import { api } from '@/lib/api/api-client';

import type { Theme } from '../types/theme';

export function listThemes(slug: string) {
  return api.get<Theme[]>(`/marketplaces/${encodeURIComponent(slug)}/themes`);
}
