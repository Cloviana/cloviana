import 'server-only';

import { api } from '@/lib/api/api-client';

import type { PreviewState } from '../types';

export function getPreview(slug: string, themeId: string) {
  return api.get<PreviewState>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/preview`,
  );
}
