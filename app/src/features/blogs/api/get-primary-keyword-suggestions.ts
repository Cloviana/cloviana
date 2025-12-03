import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig, suggestionKeys } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { SuggestedKeyword } from '@/types/api';

export const getPrimaryKeywordSuggestions = async (
  storeId: string,
  blogId: string,
): Promise<SuggestedKeyword[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  const url = `/stores/${storeId}/blogs/${blogId}/suggestions/primary-keyword`;

  return api.get<SuggestedKeyword[]>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getPrimaryKeywordSuggestionsQueryOptions = (
  storeId: string,
  blogId: string,
) =>
  queryOptions({
    queryKey: suggestionKeys.primaryKeyword(storeId, blogId),
    queryFn: () => getPrimaryKeywordSuggestions(storeId, blogId),
    enabled: Boolean(storeId && blogId),
  });

type UseGetPrimaryKeywordSuggestionsOptions = {
  storeId: string;
  blogId: string;
  queryConfig?: QueryConfig<typeof getPrimaryKeywordSuggestionsQueryOptions>;
};

export const useGetPrimaryKeywordSuggestions = ({
  storeId,
  blogId,
  queryConfig,
}: UseGetPrimaryKeywordSuggestionsOptions) =>
  useQuery({
    ...getPrimaryKeywordSuggestionsQueryOptions(storeId, blogId),
    ...queryConfig,
  });
