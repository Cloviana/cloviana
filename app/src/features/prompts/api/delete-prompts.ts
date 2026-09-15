import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, promptKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export type DeletePromptsInput = {
  businessId: string;
  promptIds: string[];
};

export const deletePrompts = async ({
  businessId,
  promptIds,
}: DeletePromptsInput): Promise<{ count: number }> => {
  const headers = await getAuthHeaders();

  return api.delete<{ count: number }>(`/businesses/${businessId}/prompts`, {
    headers,
    body: { promptIds },
  });
};

type UseDeletePromptsOptions = {
  mutationConfig?: MutationConfig<typeof deletePrompts>;
};

export const useDeletePrompts = ({
  mutationConfig,
}: UseDeletePromptsOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePrompts,
    ...mutationConfig,
    onSuccess: (...args) => {
      const { businessId } = args[1];

      void queryClient.invalidateQueries({
        queryKey: promptKeys.lists(businessId),
      });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
