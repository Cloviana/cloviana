import 'server-only';

import { api } from '@/lib/api/api-client';

import type { Theme } from '../types/theme';

export function getTheme(slug: string, themeId: string) {
  return api.get<Theme>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}`,
  );
}
