import 'server-only';

import { api } from '@/lib/api/api-client';

import type { SourceFile } from '../types';

export function listSourceFiles(slug: string, themeId: string) {
  return api.get<SourceFile[]>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/files`,
  );
}
