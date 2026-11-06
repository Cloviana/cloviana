import 'server-only';

import { api } from '@/lib/api/api-client';

import type { UpdateThemeRequest } from '../schemas/theme.schema';
import type { Theme } from '../types/theme';

export function updateTheme(
  slug: string,
  themeId: string,
  input: UpdateThemeRequest,
) {
  return api.patch<Theme>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}`,
    input,
  );
}
