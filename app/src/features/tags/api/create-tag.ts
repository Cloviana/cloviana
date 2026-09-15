import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, tagKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { Tag } from '../types';

export type CreateTagInput = {
  businessId: string;
  text: string;
};

export const createTag = async ({
  businessId,
  text,
}: CreateTagInput): Promise<Tag> => {
  const headers = await getAuthHeaders();

  return api.post<Tag>(`/businesses/${businessId}/tags`, { text }, { headers });
};

type UseCreateTagOptions = {
  mutationConfig?: MutationConfig<typeof createTag>;
};

export const useCreateTag = ({ mutationConfig }: UseCreateTagOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTag,
    ...mutationConfig,
    onSuccess: (...args) => {
      const tag = args[0];
      const { businessId } = args[1];
      const queryKey = tagKeys.list(businessId);
      const tags = queryClient.getQueryData<Tag[]>(queryKey);

      if (tags) {
        const nextTags = [...tags, tag].sort((a, b) =>
          a.text.localeCompare(b.text),
        );
        queryClient.setQueryData<Tag[]>(queryKey, nextTags);
      } else {
        void queryClient.invalidateQueries({ queryKey, exact: true });
      }
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
