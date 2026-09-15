import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { BrandKitRegion } from '../types';

import {
  type DraftMutationResult,
  useBrandKitDraftMutation,
} from './brand-kit-draft-mutation';

type RegionFields = Omit<BrandKitRegion, 'id'>;

export type CreateBrandKitRegionInput = Pick<RegionFields, 'name'> &
  Partial<Omit<RegionFields, 'name'>> & {
    businessId: string;
    id?: string;
  };

export const createBrandKitRegion = async ({
  businessId,
  ...region
}: CreateBrandKitRegionInput): Promise<DraftMutationResult<BrandKitRegion>> => {
  const headers = await getAuthHeaders();

  return api.post(`/businesses/${businessId}/brand-kit/regions`, region, {
    headers,
  });
};

export type UpdateBrandKitRegionInput = Partial<RegionFields> & {
  businessId: string;
  regionId: string;
};

export const updateBrandKitRegion = async ({
  businessId,
  regionId,
  ...region
}: UpdateBrandKitRegionInput): Promise<DraftMutationResult<BrandKitRegion>> => {
  const headers = await getAuthHeaders();

  return api.patch(
    `/businesses/${businessId}/brand-kit/regions/${regionId}`,
    region,
    { headers },
  );
};

export const deleteBrandKitRegion = async ({
  businessId,
  regionId,
}: {
  businessId: string;
  regionId: string;
}): Promise<DraftMutationResult<{ id: string }>> => {
  const headers = await getAuthHeaders();

  return api.delete(`/businesses/${businessId}/brand-kit/regions/${regionId}`, {
    headers,
  });
};

export const useCreateBrandKitRegion = (
  options: {
    mutationConfig?: MutationConfig<typeof createBrandKitRegion>;
  } = {},
) => useBrandKitDraftMutation(createBrandKitRegion, options.mutationConfig);

export const useUpdateBrandKitRegion = (
  options: {
    mutationConfig?: MutationConfig<typeof updateBrandKitRegion>;
  } = {},
) => useBrandKitDraftMutation(updateBrandKitRegion, options.mutationConfig);

export const useDeleteBrandKitRegion = (
  options: {
    mutationConfig?: MutationConfig<typeof deleteBrandKitRegion>;
  } = {},
) => useBrandKitDraftMutation(deleteBrandKitRegion, options.mutationConfig);
