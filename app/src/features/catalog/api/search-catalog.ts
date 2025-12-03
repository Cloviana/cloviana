import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { catalogKeys } from '@/lib/react-query/keys';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { SearchCatalogResponse } from '@/types/api';

type SearchCatalogParams = {
  q?: string;
  limit?: number;
};

export const searchCatalog = async (
  storeId: string,
  params?: SearchCatalogParams,
): Promise<SearchCatalogResponse> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  const response = await api.get<SearchCatalogResponse>(
    `/stores/${storeId}/catalog/search`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    },
  );
  return response;
};

export const searchCatalogQueryOptions = (
  storeId: string,
  params?: SearchCatalogParams,
) =>
  queryOptions({
    queryKey: catalogKeys.search(storeId, params),
    queryFn: () => searchCatalog(storeId, params),
    placeholderData: keepPreviousData,
    enabled: !!params?.q,
  });

type UseSearchCatalogOptions = {
  storeId: string;
  params?: SearchCatalogParams;
  queryConfig?: QueryConfig<typeof searchCatalogQueryOptions>;
};

export const useSearchCatalog = ({
  storeId,
  params,
  queryConfig,
}: UseSearchCatalogOptions) => {
  return useQuery({
    ...searchCatalogQueryOptions(storeId, params),
    ...queryConfig,
  });
};
