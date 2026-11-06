import 'server-only';

import { api } from '@/lib/api/api-client';

export function requestWorkspace(slug: string, themeId: string) {
  return api.post(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/workspace`,
    {},
  );
}
