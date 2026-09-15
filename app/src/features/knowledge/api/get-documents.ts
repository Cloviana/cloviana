import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { documentKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Document } from '@/types/api';

// ponytail: one query for every document in the business — folder lists are
// derived client-side. Switch to per-folder `?folderId=` fetches if a business
// ever holds enough documents that the payload hurts.
export const getDocuments = async (businessId: string): Promise<Document[]> => {
  const headers = await getAuthHeaders();

  return api.get<Document[]>(`/businesses/${businessId}/documents`, {
    headers,
  });
};

export const getDocumentsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: documentKeys.lists(businessId),
    queryFn: () => getDocuments(businessId),
    enabled: Boolean(businessId),
    // Ingestion is async and has no terminal failure state — a document that
    // fails is soft-deleted server-side, so it disappears from this list.
    refetchInterval: (query) =>
      query.state.data?.some(
        (document) =>
          document.status === 'PENDING' || document.status === 'PROCESSING',
      )
        ? 2_500
        : false,
  });

type UseGetDocumentsOptions = {
  queryConfig?: QueryConfig<typeof getDocumentsQueryOptions>;
};

export const useGetDocuments = (
  businessId: string,
  { queryConfig }: UseGetDocumentsOptions = {},
) =>
  useQuery({
    ...getDocumentsQueryOptions(businessId),
    ...queryConfig,
  });
