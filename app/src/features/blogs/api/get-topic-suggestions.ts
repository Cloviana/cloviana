import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const getTopicSuggestions = async (
  blogId: string,
): Promise<string[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<string[]>(
    `/blogs/${blogId}/suggestions/topic`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response;
};

export const getTopicSuggestionsQueryOptions = (blogId: string) =>
  queryOptions({
    queryKey: ['suggestions', 'topic', blogId],
    queryFn: () => getTopicSuggestions(blogId),
  });

type UseGetTopicSuggestionsOptions = {
  blogId: string;
  queryConfig?: QueryConfig<typeof getTopicSuggestionsQueryOptions>;
};

export const useGetTopicSuggestions = ({
  blogId,
  queryConfig,
}: UseGetTopicSuggestionsOptions) =>
  useQuery({
    ...getTopicSuggestionsQueryOptions(blogId),
    ...queryConfig,
  });
