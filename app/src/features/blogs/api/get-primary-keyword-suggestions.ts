import { queryOptions, useQuery } from '@tanstack/react-query';

import { SerpIntent } from '@/features/blogs/types';
import { api } from '@/lib/api-client';
import { QueryConfig, suggestionsKeys } from '@/lib/react-query';
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
): Promise<PrimaryKeywordSuggestion[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<PrimaryKeywordSuggestion[]>(
    `/blogs/${blogId}/suggestions/primary-keyword`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response;
};

export const getPrimaryKeywordSuggestionsQueryOptions = (blogId: string) =>
  queryOptions({
    queryKey: suggestionsKeys.primary(blogId),
    queryFn: () => getPrimaryKeywordSuggestions(blogId),
    enabled: Boolean(blogId),
  });

type UseGetPrimaryKeywordSuggestionsOptions = {
  blogId: string;
  queryConfig?: QueryConfig<typeof getPrimaryKeywordSuggestionsQueryOptions>;
};

export const useGetPrimaryKeywordSuggestions = ({
  blogId,
  queryConfig,
}: UseGetPrimaryKeywordSuggestionsOptions) =>
  useQuery({
    ...getPrimaryKeywordSuggestionsQueryOptions(blogId),
    ...queryConfig,
  });
