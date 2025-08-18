import { queryOptions, useQuery } from '@tanstack/react-query';

import { keywordSuggestionsKeys } from '@/api/keys';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type SuggestedKeyword = { phrase: string; id: string };

export const getKeywordSuggestions = async (
  storeId: string,
  blogId: string,
): Promise<SuggestedKeyword[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get(`/stores/${storeId}/suggestions/keywords`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { blogId },
  });
};

export const getKeywordSuggestionsQueryOptions = (
  storeId: string,
  blogId: string,
) =>
  queryOptions({
    queryKey: keywordSuggestionsKeys.list(storeId, blogId),
    queryFn: () => getKeywordSuggestions(storeId, blogId),
  });

type UseGetKeywordSuggestionsOptions = {
  storeId: string;
  blogId: string;
  queryConfig?: QueryConfig<typeof getKeywordSuggestionsQueryOptions>;
};

export const useGetKeywordSuggestions = ({
  storeId,
  blogId,
  queryConfig,
}: UseGetKeywordSuggestionsOptions) =>
  useQuery({
    ...getKeywordSuggestionsQueryOptions(storeId, blogId),
    ...queryConfig,
  });
