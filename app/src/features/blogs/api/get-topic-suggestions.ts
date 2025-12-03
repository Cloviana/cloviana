import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig, suggestionKeys } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const getTopicSuggestions = async (
  storeId: string,
  blogId: string,
): Promise<string[]> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  const url = `/stores/${storeId}/blogs/${blogId}/suggestions/topic`;

  return api.get<string[]>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getTopicSuggestionsQueryOptions = (
  storeId: string,
  blogId: string,
) =>
  queryOptions({
    queryKey: suggestionKeys.topic(storeId, blogId),
    queryFn: () => getTopicSuggestions(storeId, blogId),
    enabled: Boolean(storeId && blogId),
  });

type UseGetTopicSuggestionsOptions = {
  storeId: string;
  blogId: string;
  queryConfig?: QueryConfig<typeof getTopicSuggestionsQueryOptions>;
};

export const useGetTopicSuggestions = ({
  storeId,
  blogId,
  queryConfig,
}: UseGetTopicSuggestionsOptions) =>
  useQuery({
    ...getTopicSuggestionsQueryOptions(storeId, blogId),
    ...queryConfig,
  });
