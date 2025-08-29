import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { JobType } from '@/types/api';

import { jobsKeys, productKeys } from '../keys';

export const syncProducts = async (storeId: string) => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.post(`/stores/${storeId}/products/sync`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const useSyncProducts = (storeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => syncProducts(storeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.list(storeId) });
      qc.invalidateQueries({
        queryKey: jobsKeys.latest(storeId, 'PRODUCT_SYNC' as JobType),
      });
      qc.invalidateQueries({
        queryKey: jobsKeys.latestStatus(storeId, 'PRODUCT_SYNC' as JobType),
      });
      qc.invalidateQueries({ queryKey: jobsKeys.list(storeId) });
    },
  });
};
