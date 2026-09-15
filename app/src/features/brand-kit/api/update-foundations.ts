import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { BrandKitBrand } from '../types';

import {
  type DraftMutationResult,
  useBrandKitDraftMutation,
} from './brand-kit-draft-mutation';

type UpdateBrandKitProfileInput = {
  businessId: string;
  name?: string;
  domain?: string;
  about?: string | null;
};

type ProfileResult = {
  brand: BrandKitBrand;
  about: string | null;
};

export const updateBrandKitProfile = async ({
  businessId,
  ...profile
}: UpdateBrandKitProfileInput): Promise<DraftMutationResult<ProfileResult>> => {
  const headers = await getAuthHeaders();

  return api.patch(
    `/businesses/${businessId}/brand-kit/foundations/profile`,
    profile,
    { headers },
  );
};

type UpdateBrandKitVoiceInput = {
  businessId: string;
  voice: string | null;
};

export const updateBrandKitVoice = async ({
  businessId,
  voice,
}: UpdateBrandKitVoiceInput): Promise<
  DraftMutationResult<{ voice: string | null }>
> => {
  const headers = await getAuthHeaders();

  return api.patch(
    `/businesses/${businessId}/brand-kit/foundations/voice`,
    { voice },
    { headers },
  );
};

type UpdateBrandKitWriterPersonaInput = {
  businessId: string;
  writerPersona: string | null;
};

export const updateBrandKitWriterPersona = async ({
  businessId,
  writerPersona,
}: UpdateBrandKitWriterPersonaInput): Promise<
  DraftMutationResult<{ writerPersona: string | null }>
> => {
  const headers = await getAuthHeaders();

  return api.patch(
    `/businesses/${businessId}/brand-kit/foundations/writer-persona`,
    { writerPersona },
    { headers },
  );
};

export const useUpdateBrandKitProfile = (
  options: {
    mutationConfig?: MutationConfig<typeof updateBrandKitProfile>;
  } = {},
) => useBrandKitDraftMutation(updateBrandKitProfile, options.mutationConfig);

export const useUpdateBrandKitVoice = (
  options: {
    mutationConfig?: MutationConfig<typeof updateBrandKitVoice>;
  } = {},
) => useBrandKitDraftMutation(updateBrandKitVoice, options.mutationConfig);

export const useUpdateBrandKitWriterPersona = (
  options: {
    mutationConfig?: MutationConfig<typeof updateBrandKitWriterPersona>;
  } = {},
) =>
  useBrandKitDraftMutation(updateBrandKitWriterPersona, options.mutationConfig);
