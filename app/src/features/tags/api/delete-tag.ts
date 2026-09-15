import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, promptKeys, tagKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { Tag } from '../types';

export type DeleteTagInput = {
  businessId: string;
  tagId: string;
};

export const deleteTag = async ({
  businessId,
  tagId,
}: DeleteTagInput): Promise<void> => {
  const headers = await getAuthHeaders();

  return api.delete<void>(`/businesses/${businessId}/tags/${tagId}`, {
    headers,
  });
};

type UseDeleteTagOptions = {
  mutationConfig?: MutationConfig<typeof deleteTag>;
};

export const useDeleteTag = ({ mutationConfig }: UseDeleteTagOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTag,
    ...mutationConfig,
    onSuccess: (...args) => {
      const { businessId, tagId } = args[1];

      queryClient.setQueryData<Tag[]>(tagKeys.list(businessId), (tags) =>
        tags?.filter((tag) => tag.id !== tagId),
      );
      void queryClient.invalidateQueries({
        queryKey: promptKeys.lists(businessId),
      });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
