import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type ProductSuggestion = {
  id: string;
  title: string;
  recommended: boolean;
};

export const getProductSuggestions = async (
  blogId: string,
  topic: string,
  title: string,
): Promise<ProductSuggestion[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<ProductSuggestion[]>(
    `/blogs/${blogId}/suggestions/product?topic=${encodeURIComponent(
      topic,
    )}&title=${encodeURIComponent(title)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response;
};

export const getProductSuggestionsQueryOptions = (
  blogId: string,
  topic: string,
  title: string,
) =>
  queryOptions({
    queryKey: ['suggestions', 'product', blogId, topic, title],
    queryFn: () => getProductSuggestions(blogId, topic, title),
    enabled: Boolean(blogId && topic && title),
  });

type UseGetProductSuggestionsOptions = {
  blogId: string;
  topic: string;
  title: string;
  queryConfig?: QueryConfig<typeof getProductSuggestionsQueryOptions>;
};

export const useGetProductSuggestions = ({
  blogId,
  topic,
  title,
  queryConfig,
}: UseGetProductSuggestionsOptions) =>
  useQuery({
    ...getProductSuggestionsQueryOptions(blogId, topic, title),
    ...queryConfig,
  });
