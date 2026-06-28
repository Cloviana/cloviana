import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { documentKeys, QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Document } from '@/types/api';

export const getDocuments = async (businessId: string): Promise<Document[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<Document[]>(`/businesses/${businessId}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getDocumentsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: documentKeys.list(businessId),
    queryFn: () => getDocuments(businessId),
    enabled: Boolean(businessId),
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
