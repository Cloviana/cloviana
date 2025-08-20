import { queryOptions, useQuery } from '@tanstack/react-query';

import { storeKeys } from '@/api/keys';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Product } from '@/types/api';

export const getProducts = async (storeId: string): Promise<Product[]> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is not available');
  }
  const response = await api.get<Product[]>(`/products`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { storeId },
  });
  return response;
};

export const getProductsKey = (storeId: string) =>
  [...storeKeys.detail(storeId), 'products'] as const;

export const getProductsQueryOptions = (storeId: string) =>
  queryOptions({
    queryKey: getProductsKey(storeId),
    queryFn: () => getProducts(storeId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: Boolean(storeId),
  });

type UseGetProductsOptions = {
  config?: QueryConfig<typeof getProductsQueryOptions>;
};

export const useGetProducts = (
  storeId: string,
  { config }: UseGetProductsOptions = {},
) => {
  return useQuery({
    ...getProductsQueryOptions(storeId),
    ...config,
  });
};
