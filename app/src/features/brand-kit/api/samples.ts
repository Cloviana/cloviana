import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { BrandKitSample } from '../types';

import {
  type DraftMutationResult,
  useBrandKitDraftMutation,
} from './brand-kit-draft-mutation';

type SampleFields = Omit<BrandKitSample, 'id'>;

export type CreateBrandKitSampleInput = SampleFields & {
  businessId: string;
  id?: string;
};

export const createBrandKitSample = async ({
  businessId,
  ...sample
}: CreateBrandKitSampleInput): Promise<DraftMutationResult<BrandKitSample>> => {
  const headers = await getAuthHeaders();

  return api.post(`/businesses/${businessId}/brand-kit/samples`, sample, {
    headers,
  });
};

export type UpdateBrandKitSampleInput = Partial<SampleFields> & {
  businessId: string;
  sampleId: string;
};

export const updateBrandKitSample = async ({
  businessId,
  sampleId,
  ...sample
}: UpdateBrandKitSampleInput): Promise<DraftMutationResult<BrandKitSample>> => {
  const headers = await getAuthHeaders();

  return api.patch(
    `/businesses/${businessId}/brand-kit/samples/${sampleId}`,
    sample,
    { headers },
  );
};

export const deleteBrandKitSample = async ({
  businessId,
  sampleId,
}: {
  businessId: string;
  sampleId: string;
}): Promise<DraftMutationResult<{ id: string }>> => {
  const headers = await getAuthHeaders();

  return api.delete(`/businesses/${businessId}/brand-kit/samples/${sampleId}`, {
    headers,
  });
};

export const useCreateBrandKitSample = (
  options: {
    mutationConfig?: MutationConfig<typeof createBrandKitSample>;
  } = {},
) => useBrandKitDraftMutation(createBrandKitSample, options.mutationConfig);

export const useUpdateBrandKitSample = (
  options: {
    mutationConfig?: MutationConfig<typeof updateBrandKitSample>;
  } = {},
) => useBrandKitDraftMutation(updateBrandKitSample, options.mutationConfig);

export const useDeleteBrandKitSample = (
  options: {
    mutationConfig?: MutationConfig<typeof deleteBrandKitSample>;
  } = {},
) => useBrandKitDraftMutation(deleteBrandKitSample, options.mutationConfig);
