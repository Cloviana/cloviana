import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const getTitleSuggestions = async (
  blogId: string,
  topic: string,
  primaryKeyword: string,
): Promise<string[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<string[]>(
    `/blogs/${blogId}/suggestions/title?topic=${encodeURIComponent(topic)}&primary-keyword=${encodeURIComponent(primaryKeyword)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response;
};

export const getTitleSuggestionsQueryOptions = (
  blogId: string,
  topic: string,
  primaryKeyword: string,
) =>
  queryOptions({
    queryKey: ['suggestions', 'title', blogId, topic, primaryKeyword],
    queryFn: () => getTitleSuggestions(blogId, topic, primaryKeyword),
    enabled: Boolean(blogId && topic && primaryKeyword),
  });

type UseGetTitleSuggestionsOptions = {
  blogId: string;
  topic: string;
  primaryKeyword: string;
  queryConfig?: QueryConfig<typeof getTitleSuggestionsQueryOptions>;
};

export const useGetTitleSuggestions = ({
  blogId,
  topic,
  primaryKeyword,
  queryConfig,
}: UseGetTitleSuggestionsOptions) =>
  useQuery({
    ...getTitleSuggestionsQueryOptions(blogId, topic, primaryKeyword),
    ...queryConfig,
  });
