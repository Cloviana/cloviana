import 'server-only';

import { api } from '@/lib/api/api-client';

export function restartWorkspace(slug: string, themeId: string) {
  return api.post(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/workspace/restart`,
    {},
  );
}
