import 'server-only';

import { api } from '@/lib/api/api-client';

import type { SourceFileContent } from '../types';

export function getSourceFile(slug: string, themeId: string, path: string) {
  return api.get<SourceFileContent>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/file`,
    {
      params: { path },
    },
  );
}
