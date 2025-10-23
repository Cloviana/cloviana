import { queryOptions, useQuery } from '@tanstack/react-query';

import { SerpIntent } from '@/features/blogs/types';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
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
  topic: string,
  primaryKeyword: string,
  title: string,
): Promise<SecondaryKeywordSuggestion[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<SecondaryKeywordSuggestion[]>(
    `/blogs/${blogId}/suggestions/secondary-keywords?topic=${encodeURIComponent(
      topic,
    )}&primary-keyword=${encodeURIComponent(
      primaryKeyword,
    )}&title=${encodeURIComponent(title)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response;
};

export const getSecondaryKeywordSuggestionsQueryOptions = (
  blogId: string,
  topic: string,
  primaryKeyword: string,
  title: string,
) =>
  queryOptions({
    queryKey: [
      'suggestions',
      'secondary-keywords',
      blogId,
      topic,
      primaryKeyword,
      title,
    ],
    queryFn: () =>
      getSecondaryKeywordSuggestions(blogId, topic, primaryKeyword, title),
    enabled: Boolean(blogId && topic && primaryKeyword && title),
  });

type UseGetSecondaryKeywordSuggestionsOptions = {
  blogId: string;
  topic: string;
  primaryKeyword: string;
  title: string;
  queryConfig?: QueryConfig<typeof getSecondaryKeywordSuggestionsQueryOptions>;
};

export const useGetSecondaryKeywordSuggestions = ({
  blogId,
  topic,
  primaryKeyword,
  title,
  queryConfig,
}: UseGetSecondaryKeywordSuggestionsOptions) =>
  useQuery({
    ...getSecondaryKeywordSuggestionsQueryOptions(
      blogId,
      topic,
      primaryKeyword,
      title,
    ),
    ...queryConfig,
  });
