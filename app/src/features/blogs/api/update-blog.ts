import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { MutationConfig, blogKeys, suggestionKeys } from '@/lib/react-query';
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

  targetPersona: str.min(1).optional(),
  searchIntent: z
    .enum(['INFORMATIONAL', 'NAVIGATIONAL', 'COMMERCIAL', 'TRANSACTIONAL'])
    .optional(),
  wordCount: z.enum(['SHORT', 'MEDIUM', 'LONG']).optional(),

  primaryKeyword: str.min(1).optional(),
  secondaryKeywords: z.array(str.min(1)).optional(),
  additionalInstruction: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  currentStep: z
    .enum([
      'TOPIC',
      'PRIMARY_KEYWORD',
      'AUDIENCE_INTENT',
      'SECONDARY_KEYWORDS',
      'PRODUCT',
      'GUIDELINES',
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

      qc.setQueryData<BlogDetail>(blogKeys.detail(blogId), (old) => {
        if (!old) return old;

        return {
          ...old,
          ...updates,
        };
      });

      await Promise.all([
        qc.invalidateQueries({ queryKey: blogKeys.detail(blogId) }),
        qc.invalidateQueries({
          queryKey: suggestionKeys.topic(variables.storeId, variables.blogId),
        }),
        qc.invalidateQueries({
          queryKey: suggestionKeys.primaryKeyword(
            variables.storeId,
            variables.blogId,
          ),
        }),
        qc.invalidateQueries({
          queryKey: suggestionKeys.secondaryKeywords(
            variables.storeId,
            variables.blogId,
          ),
        }),
      ]);

      onSuccess?.(data, variables, context);
    },
    ...restConfig,
  });
};
