import 'server-only';

import { api } from '@/lib/api/api-client';

export function restoreRevision(
  slug: string,
  themeId: string,
  revisionId: string,
  expectedRevisionId: string,
) {
  return api.post(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}/editor/revisions/${encodeURIComponent(revisionId)}/restore`,
    { expectedRevisionId },
  );
}
