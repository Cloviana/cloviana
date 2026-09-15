import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, promptKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export type SetPromptsActiveInput = {
  businessId: string;
  promptIds: string[];
  active: boolean;
};

export const setPromptsActive = async ({
  businessId,
  promptIds,
  active,
}: SetPromptsActiveInput): Promise<{ count: number }> => {
  const headers = await getAuthHeaders();

  return api.patch<{ count: number }>(
    `/businesses/${businessId}/prompts`,
    { promptIds, active },
    { headers },
  );
};

type UseSetPromptsActiveOptions = {
  mutationConfig?: MutationConfig<typeof setPromptsActive>;
};

export const useSetPromptsActive = ({
  mutationConfig,
}: UseSetPromptsActiveOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setPromptsActive,
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
