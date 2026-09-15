import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, topicKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';

import type { Topic } from '../types';

export type CreateTopicInput = {
  businessId: string;
  name: string;
};

export const createTopic = async ({
  businessId,
  name,
}: CreateTopicInput): Promise<Topic> => {
  const headers = await getAuthHeaders();

  return api.post<Topic>(
    `/businesses/${businessId}/topics`,
    { name },
    {
      headers,
    },
  );
};

type UseCreateTopicOptions = {
  mutationConfig?: MutationConfig<typeof createTopic>;
};

export const useCreateTopic = ({
  mutationConfig,
}: UseCreateTopicOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTopic,
    ...mutationConfig,
    onSuccess: (...args) => {
      const topic = args[0];
      const { businessId } = args[1];
      const queryKey = topicKeys.list(businessId);
      const topics = queryClient.getQueryData<Topic[]>(queryKey);

      if (topics) {
        const nextTopics = [...topics, topic].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        queryClient.setQueryData<Topic[]>(queryKey, nextTopics);
      } else {
        void queryClient.invalidateQueries({ queryKey, exact: true });
      }
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
