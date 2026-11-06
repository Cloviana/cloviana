import 'server-only';

import { api } from '@/lib/api/api-client';

export function deleteTheme(slug: string, themeId: string) {
  return api.delete<void>(
    `/marketplaces/${encodeURIComponent(slug)}/themes/${encodeURIComponent(themeId)}`,
  );
}
