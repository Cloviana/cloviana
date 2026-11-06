import 'server-only';

import { api } from '@/lib/api/api-client';

import type { Theme } from '../types/theme';

export function restoreThemeVersion(
  slug: string,
  themeId: string,
  versionId: string,
) {
  return api.post<Theme>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/versions/${encodeURIComponent(versionId)}/restore`,
  );
}
