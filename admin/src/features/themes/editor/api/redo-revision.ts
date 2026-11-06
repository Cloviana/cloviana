import 'server-only';

import { api } from '@/lib/api/api-client';

export function redoRevision(
  slug: string,
  themeId: string,
  expectedRevisionId: string,
) {
  return api.post(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/redo`,
    {
      expectedRevisionId,
    },
  );
}
