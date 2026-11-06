import 'server-only';

import { api } from '@/lib/api/api-client';

import type { CreateThemeRequest } from '../schemas/theme.schema';
import type { Theme } from '../types/theme';

export function createTheme(slug: string, input: CreateThemeRequest) {
  return api.post<Theme>(
    `/marketplaces/${encodeURIComponent(slug)}/themes`,
    input,
  );
}
