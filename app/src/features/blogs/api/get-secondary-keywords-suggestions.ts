import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig, suggestionKeys } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { SuggestedKeyword } from '@/types/api';

export const getSecondaryKeywordSuggestions = async (
  storeId: string,
  blogId: string,
): Promise<SuggestedKeyword[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  const url = `/stores/${storeId}/blogs/${blogId}/suggestions/secondary-keywords`;

  return api.get<SuggestedKeyword[]>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getSecondaryKeywordSuggestionsQueryOptions = (
  storeId: string,
  blogId: string,
) =>
  queryOptions({
    queryKey: suggestionKeys.secondaryKeywords(storeId, blogId),
    queryFn: () => getSecondaryKeywordSuggestions(storeId, blogId),
    enabled: Boolean(storeId && blogId),
  });

type UseGetSecondaryKeywordSuggestionsOptions = {
  storeId: string;
  blogId: string;
  queryConfig?: QueryConfig<typeof getSecondaryKeywordSuggestionsQueryOptions>;
};

export const useGetSecondaryKeywordSuggestions = ({
  storeId,
  blogId,
  queryConfig,
}: UseGetSecondaryKeywordSuggestionsOptions) =>
  useQuery({
    ...getSecondaryKeywordSuggestionsQueryOptions(storeId, blogId),
    ...queryConfig,
  });
