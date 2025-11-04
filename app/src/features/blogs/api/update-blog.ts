import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig, blogKeys, suggestionsKeys } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { BlogDetail } from '@/types/api';

const str = z.string().trim();

export const updateBlogInputSchema = z.object({
  storeId: z.string().cuid(),
  blogId: z.string().uuid(),
  slug: str.min(1).optional(),
  topic: str.min(1).optional(),
  title: str.min(1).optional(),
  description: z.string().optional(),
  brandVoice: str.min(1).optional(),
  primaryKeyword: str.min(1).optional(),
  secondaryKeywords: z.array(str.min(1)).optional(),
  additionalInstruction: z.string().optional(),
  productIds: z.array(z.string().uuid()).optional(),
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
): Promise<Omit<UpdateBlogInput, 'blogId' | 'storeId'>> => {
  const { blogId, storeId, ...payload } = updateBlogInputSchema.parse(data);
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is missing');

  await api.patch(`/stores/${storeId}/blogs/${blogId}`, payload, {
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
  const qc = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateBlog,
    onSuccess: async (data, variables, context) => {
      const { blogId, ...updates } = variables;

      qc.setQueryData<BlogDetail>(blogKeys.detail(blogId), (old) => ({
        ...old!,
        ...updates,
      }));

      const changed = new Set(Object.keys(updates));

      const invalidations: Array<Promise<unknown>> = [
        qc.invalidateQueries({ queryKey: blogKeys.detail(blogId) }),
      ];

      if (changed.has('topic')) {
        invalidations.push(
          qc.invalidateQueries({ queryKey: suggestionsKeys.topics(blogId) }),
          qc.invalidateQueries({ queryKey: suggestionsKeys.primary(blogId) }),
          qc.invalidateQueries({ queryKey: suggestionsKeys.secondary(blogId) }),
          qc.invalidateQueries({ queryKey: suggestionsKeys.product(blogId) }),
        );
      }

      if (changed.has('productIds')) {
        invalidations.push(
          qc.invalidateQueries({ queryKey: suggestionsKeys.product(blogId) }),
          qc.invalidateQueries({ queryKey: suggestionsKeys.primary(blogId) }),
          qc.invalidateQueries({ queryKey: suggestionsKeys.secondary(blogId) }),
        );
      }

      if (changed.has('primaryKeyword')) {
        invalidations.push(
          qc.invalidateQueries({ queryKey: suggestionsKeys.secondary(blogId) }),
        );
      }

      await Promise.all(invalidations);

      onSuccess?.(data, variables, context);
    },
    ...restConfig,
  });
};
