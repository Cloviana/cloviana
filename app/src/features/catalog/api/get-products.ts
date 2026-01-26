import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { catalogKeys } from '@/lib/react-query/keys';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { CursorPaginatedResponse, Product } from '@/types/api';

type GetProductsParams = {
  limit?: number;
  q?: string;
  cursor?: string;
};

type ProductsResponse = CursorPaginatedResponse<Product>;

export const getProducts = async (
  storeId: string,
  params?: GetProductsParams,
): Promise<ProductsResponse> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  const response = await api.get<ProductsResponse>(
    `/stores/${storeId}/catalog/products`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    },
  );
  return response;
};

type UseGetProductsOptions = {
  storeId: string;
  params?: Omit<GetProductsParams, 'cursor'>;
  enabled?: boolean;
};

export const useGetProducts = ({
  storeId,
  params,
  enabled,
}: UseGetProductsOptions) => {
  return useInfiniteQuery({
    queryKey: catalogKeys.products(storeId, params),
    queryFn: ({ pageParam }) =>
      getProducts(storeId, {
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    enabled,
  });
};
