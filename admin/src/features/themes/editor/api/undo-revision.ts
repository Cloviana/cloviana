import 'server-only';

import { api } from '@/lib/api/api-client';

export function undoRevision(
  slug: string,
  themeId: string,
  expectedRevisionId: string,
) {
  return api.post(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/undo`,
    {
      expectedRevisionId,
    },
  );
}
