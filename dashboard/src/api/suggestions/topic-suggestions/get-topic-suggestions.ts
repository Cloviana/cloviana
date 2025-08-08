import { queryOptions, useQuery } from '@tanstack/react-query';

import { topicSuggestionsKeys } from '@/api/keys';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const getTopicSuggestions = async (
  storeId: string,
): Promise<string[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<string[]>(
    `/stores/${storeId}/suggestions/topics`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response;
};

export const getTopicSuggestionsQueryOptions = (storeId: string) =>
  queryOptions({
    queryKey: topicSuggestionsKeys.list(storeId),
    queryFn: () => getTopicSuggestions(storeId),
  });

type UseGetTopicSuggestionsOptions = {
  storeId: string;
  queryConfig?: QueryConfig<typeof getTopicSuggestionsQueryOptions>;
};

export const useGetTopicSuggestions = ({
  storeId,
  queryConfig,
}: UseGetTopicSuggestionsOptions) =>
  useQuery({
    ...getTopicSuggestionsQueryOptions(storeId),
    ...queryConfig,
  });
