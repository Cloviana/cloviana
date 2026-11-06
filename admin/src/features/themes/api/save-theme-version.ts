import 'server-only';

import { api } from '@/lib/api/api-client';

import type { CreateThemeVersionRequest } from '../schemas/theme.schema';
import type { ThemeVersion } from '../types/theme';

export function saveThemeVersion(
  slug: string,
  themeId: string,
  input: CreateThemeVersionRequest,
) {
  return api.post<ThemeVersion>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/versions`,
    input,
  );
}
