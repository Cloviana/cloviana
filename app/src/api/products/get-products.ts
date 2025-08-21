import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Product } from '@/types/api';

import { productKeys } from '../keys';

export const getProducts = async (storeId: string): Promise<Product[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<Product[]>(`/stores/${storeId}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const getProductsQueryOptions = (storeId: string) =>
  queryOptions({
    queryKey: productKeys.list(storeId),
    queryFn: () => getProducts(storeId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

type UseGetProductsOptions = {
  queryConfig?: QueryConfig<typeof getProductsQueryOptions>;
};

export const useGetProducts = (
  storeId: string,
  { queryConfig }: UseGetProductsOptions = {},
) => {
  return useQuery({
    ...getProductsQueryOptions(storeId),
    ...queryConfig,
  });
};
