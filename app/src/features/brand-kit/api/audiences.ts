import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { BrandKitAudience } from '../types';

import {
  type DraftMutationResult,
  useBrandKitDraftMutation,
} from './brand-kit-draft-mutation';

type AudienceFields = Omit<BrandKitAudience, 'id'>;

export type CreateBrandKitAudienceInput = Pick<AudienceFields, 'name'> &
  Partial<Omit<AudienceFields, 'name'>> & {
    businessId: string;
    id?: string;
  };

export const createBrandKitAudience = async ({
  businessId,
  ...audience
}: CreateBrandKitAudienceInput): Promise<
  DraftMutationResult<BrandKitAudience>
> => {
  const headers = await getAuthHeaders();

  return api.post(`/businesses/${businessId}/brand-kit/audiences`, audience, {
    headers,
  });
};

export type UpdateBrandKitAudienceInput = Partial<AudienceFields> & {
  businessId: string;
  audienceId: string;
};

export const updateBrandKitAudience = async ({
  businessId,
  audienceId,
  ...audience
}: UpdateBrandKitAudienceInput): Promise<
  DraftMutationResult<BrandKitAudience>
> => {
  const headers = await getAuthHeaders();

  return api.patch(
    `/businesses/${businessId}/brand-kit/audiences/${audienceId}`,
    audience,
    { headers },
  );
};

export const deleteBrandKitAudience = async ({
  businessId,
  audienceId,
}: {
  businessId: string;
  audienceId: string;
}): Promise<DraftMutationResult<{ id: string }>> => {
  const headers = await getAuthHeaders();

  return api.delete(
    `/businesses/${businessId}/brand-kit/audiences/${audienceId}`,
    { headers },
  );
};

export const useCreateBrandKitAudience = (
  options: {
    mutationConfig?: MutationConfig<typeof createBrandKitAudience>;
  } = {},
) => useBrandKitDraftMutation(createBrandKitAudience, options.mutationConfig);

export const useUpdateBrandKitAudience = (
  options: {
    mutationConfig?: MutationConfig<typeof updateBrandKitAudience>;
  } = {},
) => useBrandKitDraftMutation(updateBrandKitAudience, options.mutationConfig);

export const useDeleteBrandKitAudience = (
  options: {
    mutationConfig?: MutationConfig<typeof deleteBrandKitAudience>;
  } = {},
) => useBrandKitDraftMutation(deleteBrandKitAudience, options.mutationConfig);
