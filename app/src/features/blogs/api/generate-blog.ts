import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { jobKeys, MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

type GenerateBlogInput = {
  businessId: string;
  topic: string;
  instructions?: string;
};

type GenerateBlogResult = {
  jobId: string;
  enqueued: boolean;
};

export const generateBlog = async ({
  businessId,
  topic,
  instructions,
}: GenerateBlogInput): Promise<GenerateBlogResult> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.post<GenerateBlogResult>(
    `/businesses/${businessId}/blogs/generate`,
    { topic, instructions },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

type UseGenerateBlogOptions = {
  mutationConfig?: MutationConfig<typeof generateBlog>;
};

export const useGenerateBlog = ({
  mutationConfig,
}: UseGenerateBlogOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateBlog,
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.list(businessId) });
    },
    ...mutationConfig,
  });
};
