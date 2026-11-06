import 'server-only';

import { api } from '@/lib/api/api-client';

import type { ThemeVersion } from '../types/theme';

export function listThemeVersions(slug: string, themeId: string) {
  return api.get<ThemeVersion[]>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/versions`,
  );
}
