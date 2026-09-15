import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, promptKeys, topicKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { Topic } from '../types';

export type DeleteTopicInput = {
  businessId: string;
  topicId: string;
};

export const deleteTopic = async ({
  businessId,
  topicId,
}: DeleteTopicInput): Promise<void> => {
  const headers = await getAuthHeaders();

  return api.delete<void>(`/businesses/${businessId}/topics/${topicId}`, {
    headers,
  });
};

type UseDeleteTopicOptions = {
  mutationConfig?: MutationConfig<typeof deleteTopic>;
};

export const useDeleteTopic = ({
  mutationConfig,
}: UseDeleteTopicOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTopic,
    ...mutationConfig,
    onSuccess: (...args) => {
      const { businessId, topicId } = args[1];

      queryClient.setQueryData<Topic[]>(topicKeys.list(businessId), (topics) =>
        topics?.filter((topic) => topic.id !== topicId),
      );
      void queryClient.invalidateQueries({
        queryKey: promptKeys.lists(businessId),
      });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
