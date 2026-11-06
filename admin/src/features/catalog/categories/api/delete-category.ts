import 'server-only';

import { api } from '@/lib/api/api-client';

export function deleteCategory(slug: string, id: string) {
  return api.delete<void>(
    `/marketplaces/${encodeURIComponent(slug)}/categories/${encodeURIComponent(id)}`,
  );
}
