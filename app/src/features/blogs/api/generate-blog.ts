import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { blogKeys, MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export const generateBlogInputSchema = z.object({
  storeId: z.string().min(1, 'Required'),
  blogId: z.string().min(1, 'Required'),
});

export type GenerateBlogInput = z.infer<typeof generateBlogInputSchema>;

type GenerateBlogResponse = { ok: boolean };

export const generateBlog = async ({
  data,
}: {
  data: GenerateBlogInput;
}): Promise<GenerateBlogResponse> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is missing');
  return api.post<GenerateBlogResponse>(
    `/stores/${data.storeId}/blogs/${data.blogId}/generate`,
    undefined,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
};

type UseGenerateBlogOptions = {
  mutationConfig?: MutationConfig<typeof generateBlog>;
};

export const useGenerateBlog = ({
  mutationConfig,
}: UseGenerateBlogOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: generateBlog,
    onSuccess: async (res, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: blogKeys.detail(variables.data.blogId),
      });
      onSuccess?.(res, variables, context);
    },
    ...restConfig,
  });
};
