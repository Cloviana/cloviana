import axios from 'axios';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { BrandKitProduct } from '../types';

import {
  type DraftMutationResult,
  useBrandKitDraftMutation,
} from './brand-kit-draft-mutation';
import { addProductCompetitor } from './product-competitors';

type ProductFields = Omit<BrandKitProduct, 'id' | 'competitorBrandIds'>;

export type CreateBrandKitProductInput = Pick<ProductFields, 'name'> &
  Partial<Omit<ProductFields, 'name'>> & {
    businessId: string;
    id?: string;
  };

export const createBrandKitProduct = async ({
  businessId,
  ...product
}: CreateBrandKitProductInput): Promise<
  DraftMutationResult<BrandKitProduct>
> => {
  const headers = await getAuthHeaders();

  return api.post(`/businesses/${businessId}/brand-kit/products`, product, {
    headers,
  });
};

export type UpdateBrandKitProductInput = Partial<ProductFields> & {
  businessId: string;
  productId: string;
};

export type SaveBrandKitProductInput = ProductFields & {
  businessId: string;
  productId: string;
  competitorBrandIds: string[];
};

export const updateBrandKitProduct = async ({
  businessId,
  productId,
  ...product
}: UpdateBrandKitProductInput): Promise<
  DraftMutationResult<BrandKitProduct>
> => {
  const headers = await getAuthHeaders();

  return api.patch(
    `/businesses/${businessId}/brand-kit/products/${productId}`,
    product,
    { headers },
  );
};

export type DeleteBrandKitProductInput = {
  businessId: string;
  productId: string;
};

export const deleteBrandKitProduct = async ({
  businessId,
  productId,
}: DeleteBrandKitProductInput): Promise<
  DraftMutationResult<{ id: string }>
> => {
  const headers = await getAuthHeaders();

  return api.delete(
    `/businesses/${businessId}/brand-kit/products/${productId}`,
    { headers },
  );
};

export const saveBrandKitProduct = async ({
  businessId,
  productId,
  competitorBrandIds,
  ...product
}: SaveBrandKitProductInput): Promise<DraftMutationResult<BrandKitProduct>> => {
  try {
    return await updateBrandKitProduct({ businessId, productId, ...product });
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      throw error;
    }

    let result = await createBrandKitProduct({
      businessId,
      id: productId,
      ...product,
    });

    for (const brandId of competitorBrandIds) {
      result = await addProductCompetitor({
        businessId,
        productId,
        brandId,
      });
    }

    return result;
  }
};

export const useCreateBrandKitProduct = (
  options: {
    mutationConfig?: MutationConfig<typeof createBrandKitProduct>;
  } = {},
) => useBrandKitDraftMutation(createBrandKitProduct, options.mutationConfig);

export const useSaveBrandKitProduct = (
  options: {
    mutationConfig?: MutationConfig<typeof saveBrandKitProduct>;
  } = {},
) => useBrandKitDraftMutation(saveBrandKitProduct, options.mutationConfig);

export const useDeleteBrandKitProduct = (
  options: {
    mutationConfig?: MutationConfig<typeof deleteBrandKitProduct>;
  } = {},
) => useBrandKitDraftMutation(deleteBrandKitProduct, options.mutationConfig);
