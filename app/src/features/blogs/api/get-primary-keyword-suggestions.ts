import { queryOptions, useQuery } from '@tanstack/react-query';

import { SerpIntent } from '@/features/blogs/types';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type PrimaryKeywordSuggestion = {
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent?: SerpIntent;
  recommended: boolean;
};

export const getPrimaryKeywordSuggestions = async (
  blogId: string,
  topic: string,
): Promise<PrimaryKeywordSuggestion[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<PrimaryKeywordSuggestion[]>(
    `/blogs/${blogId}/suggestions/primary-keyword?topic=${encodeURIComponent(topic)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response;
};

export const getPrimaryKeywordSuggestionsQueryOptions = (
  blogId: string,
  topic: string,
) =>
  queryOptions({
    queryKey: ['suggestions', 'primary-keyword', blogId, topic],
    queryFn: () => getPrimaryKeywordSuggestions(blogId, topic),
    enabled: Boolean(blogId && topic),
  });

type UseGetPrimaryKeywordSuggestionsOptions = {
  blogId: string;
  topic: string;
  queryConfig?: QueryConfig<typeof getPrimaryKeywordSuggestionsQueryOptions>;
};

export const useGetPrimaryKeywordSuggestions = ({
  blogId,
  topic,
  queryConfig,
}: UseGetPrimaryKeywordSuggestionsOptions) =>
  useQuery({
    ...getPrimaryKeywordSuggestionsQueryOptions(blogId, topic),
    ...queryConfig,
  });
