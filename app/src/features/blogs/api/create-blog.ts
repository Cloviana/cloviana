import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { blogKeys, MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Blog } from '@/types/api';

export const createBlogInputSchema = z.object({
  storeId: z.string().min(1, 'Required'),
});

export type CreateBlogInput = z.infer<typeof createBlogInputSchema>;

export const createBlog = async ({
  data,
}: {
  data: CreateBlogInput;
}): Promise<Blog> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }
  return api.post<Blog>(
    `/stores/${data.storeId}/blogs`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
};

type UseCreateBlogOptions = {
  mutationConfig?: MutationConfig<typeof createBlog>;
};

export const useCreateBlog = ({
  mutationConfig,
}: UseCreateBlogOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: createBlog,
    onSuccess: (newBlog, variables, context) => {
      queryClient.setQueryData<Blog>(blogKeys.detail(newBlog.id), newBlog);
      onSuccess?.(newBlog, variables, context);
    },
    ...restConfig,
  });
};
