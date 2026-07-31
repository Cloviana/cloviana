import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { documentKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Document } from '@/types/api';

export const getDocuments = async (
  businessId: string,
  folderId: string,
): Promise<Document[]> => {
  const headers = await getAuthHeaders();
  return api.get<Document[]>(`/businesses/${businessId}/documents`, {
    headers,
    params: { folderId },
  });
};

export const getDocumentsQueryOptions = (
  businessId: string,
  folderId?: string,
) =>
  queryOptions({
    queryKey: documentKeys.list(businessId, folderId ?? ''),
    queryFn: () =>
      folderId ? getDocuments(businessId, folderId) : Promise.resolve([]),
    enabled: Boolean(businessId && folderId),
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
  folderId?: string,
  { queryConfig }: UseGetDocumentsOptions = {},
) =>
  useQuery({
    ...getDocumentsQueryOptions(businessId, folderId),
    ...queryConfig,
  });
