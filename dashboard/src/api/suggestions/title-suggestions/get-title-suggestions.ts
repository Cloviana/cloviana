import { queryOptions, useQuery } from '@tanstack/react-query';

import { titleSuggestionsKeys } from '@/api/keys';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const getTitleSuggestions = async (
  storeId: string,
  blogId: string,
): Promise<string[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  const response = await api.get<string[]>(
    `/stores/${storeId}/suggestions/titles`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { blogId },
    },
  );
  return response;
};

export const getTitleSuggestionsQueryOptions = (
  storeId: string,
  blogId: string,
) =>
  queryOptions({
    queryKey: titleSuggestionsKeys.list(storeId, blogId),
    queryFn: () => getTitleSuggestions(storeId, blogId),
  });

type UseGetTitleSuggestionsOptions = {
  storeId: string;
  blogId: string;
  queryConfig?: QueryConfig<typeof getTitleSuggestionsQueryOptions>;
};

export const useGetTitleSuggestions = ({
  storeId,
  blogId,
  queryConfig,
}: UseGetTitleSuggestionsOptions) =>
  useQuery({
    ...getTitleSuggestionsQueryOptions(storeId, blogId),
    ...queryConfig,
  });
