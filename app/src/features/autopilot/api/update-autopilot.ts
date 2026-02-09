import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { autopilotKeys, MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { AutopilotSettings } from '@/types/api';

const dayOfWeekSchema = z.enum([
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
]);
const contentMixSchema = z.enum(['BALANCED', 'PROBLEM_SOLUTION', 'COMPARISON']);

export const updateAutopilotInputSchema = z.object({
  storeId: z.string().cuid(),
  enabled: z.boolean(),
  blog: z
    .object({
      collectionIds: z.array(z.string().uuid()).default([]),
      contentMix: contentMixSchema,
      publishDays: z.array(dayOfWeekSchema).default([]),
      autoPublish: z.boolean(),
    })
    .optional(),
});

export type UpdateAutopilotInput = z.infer<typeof updateAutopilotInputSchema>;

export const updateAutopilot = async (
  data: UpdateAutopilotInput,
): Promise<AutopilotSettings> => {
  const parsed = updateAutopilotInputSchema.parse(data);
  const { storeId, ...payload } = parsed;

  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is missing');

  return api.put<AutopilotSettings>(`/stores/${storeId}/autopilot`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

type UseUpdateAutopilotOptions = {
  mutationConfig?: MutationConfig<typeof updateAutopilot>;
};

export const useUpdateAutopilot = ({
  mutationConfig,
}: UseUpdateAutopilotOptions = {}) => {
  const qc = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    mutationFn: updateAutopilot,
    onSuccess: async (updatedSettings, variables, context) => {
      const { storeId } = variables;

      qc.setQueryData<AutopilotSettings>(
        autopilotKeys.settings(storeId),
        updatedSettings,
      );
      await qc.invalidateQueries({
        queryKey: autopilotKeys.settings(storeId),
      });

      onSuccess?.(updatedSettings, variables, context);
    },
    ...restConfig,
  });
};
