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
      'PRODUCT',
      'AUDIENCE_INTENT',
      'TOPIC',
      'PRIMARY_KEYWORD',
      'SECONDARY_KEYWORDS',
      'GUIDELINES',
      'COMPLETED',
    ])
    .optional(),
});

export type UpdateBlogInput = z.infer<typeof updateBlogInputSchema>;

// Step order configuration
const STEP_ORDER = [
  'PRODUCT',
  'AUDIENCE_INTENT',
  'TOPIC',
  'PRIMARY_KEYWORD',
  'SECONDARY_KEYWORDS',
  'GUIDELINES',
  'COMPLETED',
] as const;

// Map steps to their suggestion invalidation functions
const STEP_SUGGESTION_INVALIDATORS = {
  TOPIC: (storeId: string, blogId: string) => [
    suggestionKeys.topic(storeId, blogId),
  ],
  PRIMARY_KEYWORD: (storeId: string, blogId: string) => [
    suggestionKeys.primaryKeyword(storeId, blogId),
  ],
  SECONDARY_KEYWORDS: (storeId: string, blogId: string) => [
    suggestionKeys.secondaryKeywords(storeId, blogId),
  ],
} as const;

// Get all steps that should have their suggestions invalidated
const getStepsToInvalidate = (currentStep: (typeof STEP_ORDER)[number]) => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  return STEP_ORDER.slice(currentIndex + 1).filter(
    (step): step is keyof typeof STEP_SUGGESTION_INVALIDATORS =>
      step in STEP_SUGGESTION_INVALIDATORS,
  );
};

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
      const { blogId, currentStep, storeId, ...updates } = variables;

      qc.setQueryData<BlogDetail>(blogKeys.detail(blogId), (old) => {
        if (!old) return old;

        return {
          ...old,
          ...updates,
        };
      });

      // Always invalidate the blog detail
      const invalidations = [
        qc.invalidateQueries({ queryKey: blogKeys.detail(blogId) }),
      ];

      // If currentStep is provided, invalidate only downstream suggestions
      if (currentStep) {
        const stepsToInvalidate = getStepsToInvalidate(currentStep);

        stepsToInvalidate.forEach((step) => {
          const queryKeys = STEP_SUGGESTION_INVALIDATORS[step](storeId, blogId);
          queryKeys.forEach((queryKey) => {
            invalidations.push(qc.invalidateQueries({ queryKey }));
          });
        });
      } else {
        // If no currentStep, invalidate all suggestions (legacy behavior)
        invalidations.push(
          qc.invalidateQueries({
            queryKey: suggestionKeys.topic(storeId, blogId),
          }),
          qc.invalidateQueries({
            queryKey: suggestionKeys.primaryKeyword(storeId, blogId),
          }),
          qc.invalidateQueries({
            queryKey: suggestionKeys.secondaryKeywords(storeId, blogId),
          }),
        );
      }

      await Promise.all(invalidations);

      onSuccess?.(data, variables, context);
    },
    ...restConfig,
  });
};
