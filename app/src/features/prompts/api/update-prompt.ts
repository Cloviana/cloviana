import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, promptKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptMutationResult, PromptPayload } from '../types';

export type UpdatePromptInput = Partial<PromptPayload> & {
  businessId: string;
  promptId: string;
};

export const updatePrompt = async ({
  businessId,
  promptId,
  ...update
}: UpdatePromptInput): Promise<PromptMutationResult> => {
  const headers = await getAuthHeaders();

  return api.patch<PromptMutationResult>(
    `/businesses/${businessId}/prompts/${promptId}`,
    update,
    { headers },
  );
};

type UseUpdatePromptOptions = {
  mutationConfig?: MutationConfig<typeof updatePrompt>;
};

export const useUpdatePrompt = ({
  mutationConfig,
}: UseUpdatePromptOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrompt,
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
