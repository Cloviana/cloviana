import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { BrandKitRule } from '../types';

import {
  type DraftMutationResult,
  useBrandKitDraftMutation,
} from './brand-kit-draft-mutation';

type RuleFields = Omit<BrandKitRule, 'id'>;

export type CreateBrandKitRuleInput = Pick<RuleFields, 'scope' | 'content'> &
  Partial<Omit<RuleFields, 'scope' | 'content'>> & {
    businessId: string;
    id?: string;
  };

export const createBrandKitRule = async ({
  businessId,
  ...rule
}: CreateBrandKitRuleInput): Promise<DraftMutationResult<BrandKitRule>> => {
  const headers = await getAuthHeaders();

  return api.post(`/businesses/${businessId}/brand-kit/rules`, rule, {
    headers,
  });
};

export type UpdateBrandKitRuleInput = Partial<RuleFields> & {
  businessId: string;
  ruleId: string;
};

export const updateBrandKitRule = async ({
  businessId,
  ruleId,
  ...rule
}: UpdateBrandKitRuleInput): Promise<DraftMutationResult<BrandKitRule>> => {
  const headers = await getAuthHeaders();

  return api.patch(
    `/businesses/${businessId}/brand-kit/rules/${ruleId}`,
    rule,
    { headers },
  );
};

export const deleteBrandKitRule = async ({
  businessId,
  ruleId,
}: {
  businessId: string;
  ruleId: string;
}): Promise<DraftMutationResult<{ id: string }>> => {
  const headers = await getAuthHeaders();

  return api.delete(`/businesses/${businessId}/brand-kit/rules/${ruleId}`, {
    headers,
  });
};

export const useCreateBrandKitRule = (
  options: {
    mutationConfig?: MutationConfig<typeof createBrandKitRule>;
  } = {},
) => useBrandKitDraftMutation(createBrandKitRule, options.mutationConfig);

export const useUpdateBrandKitRule = (
  options: {
    mutationConfig?: MutationConfig<typeof updateBrandKitRule>;
  } = {},
) => useBrandKitDraftMutation(updateBrandKitRule, options.mutationConfig);

export const useDeleteBrandKitRule = (
  options: {
    mutationConfig?: MutationConfig<typeof deleteBrandKitRule>;
  } = {},
) => useBrandKitDraftMutation(deleteBrandKitRule, options.mutationConfig);
