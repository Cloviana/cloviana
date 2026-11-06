import 'server-only';

import { api } from '@/lib/api/api-client';

import type { Theme } from '../types/theme';

export function duplicateTheme(slug: string, themeId: string) {
  return api.post<Theme>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/duplicate`,
  );
}
