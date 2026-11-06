import 'server-only';

import { api } from '@/lib/api/api-client';

import type { RevisionHistory } from '../types';

export function listRevisions(slug: string, themeId: string) {
  return api.get<RevisionHistory>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/revisions`,
  );
}
