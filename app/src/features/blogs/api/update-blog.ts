import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { BlogDetail } from '@/types/api';

const str = z.string().trim();

export const updateBlogInputSchema = z.object({
  blogId: z.string().uuid(),
  slug: str.min(1).optional(),
  topic: str.min(1).optional(),
  title: str.min(1).optional(),
  description: z.string().optional(),
  brandVoice: str.min(1).optional(),
  primaryKeyword: str.min(1).optional(),
  secondaryKeywords: z.array(str.min(1)).optional(),
  additionalInstruction: z.string().optional(),
  productId: z.string().uuid().optional(),
  currentStep: z
    .enum([
      'TOPIC',
      'PRIMARY_KEYWORD',
      'TITLE',
      'SECONDARY_KEYWORDS',
      'PRODUCT',
      'ENHANCEMENTS',
      'COMPLETED',
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
      queryClient.setQueryData<BlogDetail>(
        ['blogs', 'detail', blogId],
        (old) => ({
          ...old!,
          ...updates,
        }),
      );
      onSuccess?.(data, variables, context);
    },

    ...restConfig,
  });
};
