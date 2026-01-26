import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig, blogKeys } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { BlogDetail } from '@/types/api';

const str = z.string().trim();

export const updateBlogInputSchema = z.object({
  storeId: z.string().cuid(),
  blogId: z.string().uuid(),
  slug: str.min(1).optional(),
  topic: str.min(1).optional().nullable(),
  title: str.min(1).optional(),
  description: z.string().optional(),
  primaryKeyword: str.min(1).optional().nullable(),
  secondaryKeywords: z.array(str.min(1)).optional(),
  contentType: z.enum(['PROBLEM_SOLUTION', 'COMPARISON']).optional(),
  productIds: z.array(z.string()).optional(),
  currentStep: z
    .enum([
      'CONTENT_TYPE',
      'PRODUCT',
      'TOPIC',
      'PRIMARY_KEYWORD',
      'SECONDARY_KEYWORDS',
      'COMPLETED',
    ])
    .optional(),
});

export type UpdateBlogInput = z.infer<typeof updateBlogInputSchema>;

export const updateBlog = async (
  data: UpdateBlogInput,
): Promise<BlogDetail> => {
  const parsed = updateBlogInputSchema.parse(data);
  const { blogId, storeId, ...payload } = parsed;

  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is missing');

  return api.patch<BlogDetail>(`/stores/${storeId}/blogs/${blogId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

type UseUpdateBlogOptions = {
  mutationConfig?: MutationConfig<typeof updateBlog>;
};

export const useUpdateBlog = ({
  mutationConfig,
}: UseUpdateBlogOptions = {}) => {
  const qc = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateBlog,
    onSuccess: async (updatedBlog, variables, context) => {
      const { blogId } = variables;

      qc.setQueryData<BlogDetail>(blogKeys.detail(blogId), updatedBlog);
      await qc.invalidateQueries({ queryKey: blogKeys.detail(blogId) });

      onSuccess?.(updatedBlog, variables, context);
    },
    ...restConfig,
  });
};
