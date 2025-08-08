import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Blog } from '@/types/api';

import { blogsKeys } from '../keys';

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
  return api.post<Blog>('/blogs', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
      queryClient.setQueryData<Blog>(blogsKeys.detail(newBlog.id), newBlog);
      onSuccess?.(newBlog, variables, context);
    },
    ...restConfig,
  });
};
