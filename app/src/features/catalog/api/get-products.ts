import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { catalogKeys } from '@/lib/react-query/keys';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { PaginatedResponse, Product } from '@/types/api';

type GetProductsParams = {
  page?: number;
  limit?: number;
};

type ProductsResponse = PaginatedResponse<Product[]>;

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

export const getProductsQueryOptions = (
  storeId: string,
  params?: GetProductsParams,
) =>
  queryOptions({
    queryKey: catalogKeys.products(storeId, params),
    queryFn: () => getProducts(storeId, params),
  });

type UseGetProductsOptions = {
  storeId: string;
  params?: GetProductsParams;
  queryConfig?: QueryConfig<typeof getProductsQueryOptions>;
};

export const useGetProducts = ({
  storeId,
  params,
  queryConfig,
}: UseGetProductsOptions) => {
  return useQuery({
    ...getProductsQueryOptions(storeId, params),
    ...queryConfig,
  });
};
