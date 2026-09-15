import type { QueryClient } from '@tanstack/react-query';

import { documentKeys, folderKeys } from '@/lib/react-query';

// The server owns document positions and folder counts, and rewrites siblings
// on every move — so refetch both lists after a mutation instead of trying to
// mirror those writes in the cache.
export function revalidateKnowledge(
  queryClient: QueryClient,
  businessId: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: documentKeys.lists(businessId),
      exact: true,
    }),
    queryClient.invalidateQueries({
      queryKey: folderKeys.list(businessId),
      exact: true,
    }),
  ]);
}
