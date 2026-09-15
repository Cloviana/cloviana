import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { WorkflowRunStatus } from '@/types/api';

export type CreateContentTypeResearchInput = {
  businessId: string;
  requestId: string;
  name: string;
  sampleUrl: string;
};

export type CreateContentTypeResearchResponse = {
  workflowRunId: string | null;
  contentTypeId: string;
  name: string;
  status: WorkflowRunStatus | null;
  enqueued: boolean;
  reason: string;
};

export const createContentTypeResearch = async ({
  businessId,
  ...payload
}: CreateContentTypeResearchInput): Promise<CreateContentTypeResearchResponse> => {
  const headers = await getAuthHeaders();

  return api.post<CreateContentTypeResearchResponse>(
    `/businesses/${businessId}/brand-kit/content-type-research`,
    payload,
    { headers },
  );
};

type UseCreateContentTypeResearchOptions = {
  mutationConfig?: MutationConfig<typeof createContentTypeResearch>;
};

export const useCreateContentTypeResearch = ({
  mutationConfig,
}: UseCreateContentTypeResearchOptions = {}) =>
  useMutation({
    mutationFn: createContentTypeResearch,
    ...mutationConfig,
  });
