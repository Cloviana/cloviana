import { queryOptions, useQuery } from '@tanstack/react-query';

import { SerpIntent } from '@/features/blogs/types';
import { api } from '@/lib/api-client';
import { QueryConfig, suggestionsKeys } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type SecondaryKeywordSuggestion = {
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent?: SerpIntent;
  recommended: boolean;
};

export const getSecondaryKeywordSuggestions = async (
  blogId: string,
): Promise<SecondaryKeywordSuggestion[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<SecondaryKeywordSuggestion[]>(
    `/blogs/${blogId}/suggestions/secondary-keywords`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response;
};

export const getSecondaryKeywordSuggestionsQueryOptions = (blogId: string) =>
  queryOptions({
    queryKey: suggestionsKeys.secondary(blogId),
    queryFn: () => getSecondaryKeywordSuggestions(blogId),
    enabled: Boolean(blogId),
  });

type UseGetSecondaryKeywordSuggestionsOptions = {
  blogId: string;
  queryConfig?: QueryConfig<typeof getSecondaryKeywordSuggestionsQueryOptions>;
};

export const useGetSecondaryKeywordSuggestions = ({
  blogId,
  queryConfig,
}: UseGetSecondaryKeywordSuggestionsOptions) =>
  useQuery({
    ...getSecondaryKeywordSuggestionsQueryOptions(blogId),
    ...queryConfig,
  });
