import 'server-only';

import { api } from '@/lib/api/api-client';

export function listChanges(slug: string, themeId: string) {
  return api.get<string[]>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/changes`,
  );
}
