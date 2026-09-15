import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { WorkflowRunStatus } from '@/types/api';

export type CreateProductResearchInput = {
  businessId: string;
  requestId: string;
  name: string;
  contextUrl: string;
};

export type CreateProductResearchResponse = {
  workflowRunId: string | null;
  productId: string;
  name: string;
  status: WorkflowRunStatus | null;
  enqueued: boolean;
  reason: string;
};

export const createProductResearch = async ({
  businessId,
  ...payload
}: CreateProductResearchInput): Promise<CreateProductResearchResponse> => {
  const headers = await getAuthHeaders();

  return api.post<CreateProductResearchResponse>(
    `/businesses/${businessId}/brand-kit/product-research`,
    payload,
    { headers },
  );
};

type UseCreateProductResearchOptions = {
  mutationConfig?: MutationConfig<typeof createProductResearch>;
};

export const useCreateProductResearch = ({
  mutationConfig,
}: UseCreateProductResearchOptions = {}) =>
  useMutation({
    mutationFn: createProductResearch,
    ...mutationConfig,
  });
