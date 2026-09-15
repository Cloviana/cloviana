import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { BrandKitContentType } from '../types';

import {
  type DraftMutationResult,
  useBrandKitDraftMutation,
} from './brand-kit-draft-mutation';

type ContentTypeFields = Omit<BrandKitContentType, 'id'>;

export type CreateBrandKitContentTypeInput = Pick<ContentTypeFields, 'name'> &
  Partial<Omit<ContentTypeFields, 'name'>> & {
    businessId: string;
    id?: string;
  };

export const createBrandKitContentType = async ({
  businessId,
  ...contentType
}: CreateBrandKitContentTypeInput): Promise<
  DraftMutationResult<BrandKitContentType>
> => {
  const headers = await getAuthHeaders();

  return api.post(
    `/businesses/${businessId}/brand-kit/content-types`,
    contentType,
    { headers },
  );
};

export type UpdateBrandKitContentTypeInput = Partial<ContentTypeFields> & {
  businessId: string;
  contentTypeId: string;
};

export const updateBrandKitContentType = async ({
  businessId,
  contentTypeId,
  ...contentType
}: UpdateBrandKitContentTypeInput): Promise<
  DraftMutationResult<BrandKitContentType>
> => {
  const headers = await getAuthHeaders();

  return api.patch(
    `/businesses/${businessId}/brand-kit/content-types/${contentTypeId}`,
    contentType,
    { headers },
  );
};

export const deleteBrandKitContentType = async ({
  businessId,
  contentTypeId,
}: {
  businessId: string;
  contentTypeId: string;
}): Promise<DraftMutationResult<{ id: string }>> => {
  const headers = await getAuthHeaders();

  return api.delete(
    `/businesses/${businessId}/brand-kit/content-types/${contentTypeId}`,
    { headers },
  );
};

export const useCreateBrandKitContentType = (
  options: {
    mutationConfig?: MutationConfig<typeof createBrandKitContentType>;
  } = {},
) =>
  useBrandKitDraftMutation(createBrandKitContentType, options.mutationConfig);

export const useUpdateBrandKitContentType = (
  options: {
    mutationConfig?: MutationConfig<typeof updateBrandKitContentType>;
  } = {},
) =>
  useBrandKitDraftMutation(updateBrandKitContentType, options.mutationConfig);

export const useDeleteBrandKitContentType = (
  options: {
    mutationConfig?: MutationConfig<typeof deleteBrandKitContentType>;
  } = {},
) =>
  useBrandKitDraftMutation(deleteBrandKitContentType, options.mutationConfig);
