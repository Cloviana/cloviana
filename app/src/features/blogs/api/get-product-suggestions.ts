import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig, suggestionsKeys } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type ProductSuggestion = {
  id: string;
  title: string;
  imageUrl: string;
  recommended: boolean;
};

export const getProductSuggestions = async (
  blogId: string,
): Promise<ProductSuggestion[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<ProductSuggestion[]>(
    `/blogs/${blogId}/suggestions/product`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response;
};

export const getProductSuggestionsQueryOptions = (blogId: string) =>
  queryOptions({
    queryKey: suggestionsKeys.product(blogId),
    queryFn: () => getProductSuggestions(blogId),
    enabled: Boolean(blogId),
  });

type UseGetProductSuggestionsOptions = {
  blogId: string;
  queryConfig?: QueryConfig<typeof getProductSuggestionsQueryOptions>;
};

export const useGetProductSuggestions = ({
  blogId,
  queryConfig,
}: UseGetProductSuggestionsOptions) =>
  useQuery({
    ...getProductSuggestionsQueryOptions(blogId),
    ...queryConfig,
  });
