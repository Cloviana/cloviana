import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { BrandKitProduct } from '../types';

import {
  type DraftMutationResult,
  useBrandKitDraftMutation,
} from './brand-kit-draft-mutation';

export type ProductCompetitorInput = {
  businessId: string;
  productId: string;
  brandId: string;
};

export const addProductCompetitor = async ({
  businessId,
  productId,
  brandId,
}: ProductCompetitorInput): Promise<DraftMutationResult<BrandKitProduct>> => {
  const headers = await getAuthHeaders();

  return api.post(
    `/businesses/${businessId}/brand-kit/products/${productId}/competitors/${brandId}`,
    undefined,
    { headers },
  );
};

export const useAddProductCompetitor = (
  options: {
    mutationConfig?: MutationConfig<typeof addProductCompetitor>;
  } = {},
) => useBrandKitDraftMutation(addProductCompetitor, options.mutationConfig);
