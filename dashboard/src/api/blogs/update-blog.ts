import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { BlogDetail } from '@/types/api';

import { blogsKeys } from '../keys';

export const updateBlogInputSchema = z.object({
  blogId: z.string().min(1),
  keywordId: z.string().min(1),
  slug: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  generationStep: z
    .enum([
      'TOPIC',
      'KEYWORD',
      'COMPETITORS',
      'TITLE',
      'SECONDARY_KEYWORDS',
      'META',
      'REVIEW',
      'COMPLETE',
    ])
    .optional(),
});
export type UpdateBlogInput = z.infer<typeof updateBlogInputSchema>;

export const updateBlog = async (
  data: UpdateBlogInput,
): Promise<Omit<UpdateBlogInput, 'blogId'>> => {
  const { blogId, ...payload } = updateBlogInputSchema.parse(data);
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is missing');

  await api.patch(`/blogs/${blogId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return payload;
};

type UseUpdateBlogOptions = {
  mutationConfig?: MutationConfig<typeof updateBlog>;
};

export const useUpdateBlog = ({
  mutationConfig,
}: UseUpdateBlogOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateBlog,
    onSuccess: (data, variables, context) => {
      const { blogId, ...updates } = variables;
      queryClient.setQueryData<BlogDetail>(blogsKeys.detail(blogId), (old) => ({
        ...old!,
        ...updates,
      }));
      onSuccess?.(data, variables, context);
    },

    ...restConfig,
  });
};
