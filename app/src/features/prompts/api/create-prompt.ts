import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, promptKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { PromptMutationResult, PromptPayload } from '../types';

export type CreatePromptInput = PromptPayload & {
  businessId: string;
};

export const createPrompt = async ({
  businessId,
  ...prompt
}: CreatePromptInput): Promise<PromptMutationResult> => {
  const headers = await getAuthHeaders();

  return api.post<PromptMutationResult>(
    `/businesses/${businessId}/prompts`,
    prompt,
    { headers },
  );
};

type UseCreatePromptOptions = {
  mutationConfig?: MutationConfig<typeof createPrompt>;
};

export const useCreatePrompt = ({
  mutationConfig,
}: UseCreatePromptOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrompt,
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
