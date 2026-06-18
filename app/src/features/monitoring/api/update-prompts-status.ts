import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

export type UpdatePromptsStatusRequest = {
  promptIds: string[];
  status: 'ACTIVE' | 'INACTIVE';
};

export const updatePromptsStatus = async (
  businessId: string,
  payload: UpdatePromptsStatusRequest,
): Promise<{ success: boolean }> => {
  const headers = await getAuthHeaders();
  return api.patch<{ success: boolean }>(
    `/businesses/${businessId}/monitoring/prompts/status`,
    payload,
    { headers },
  );
};

export const useUpdatePromptsStatus = (businessId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePromptsStatusRequest) =>
      updatePromptsStatus(businessId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['monitoring', 'prompts', businessId],
      });
    },
  });
};
