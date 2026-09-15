import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { brandKitKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { WorkflowRun } from '@/types/api';

import type { BrandKitContentType, SampleKind } from '../types';

export type ContentTypeResearchResult = {
  contentType: BrandKitContentType;
  sample: { kind: SampleKind; value: string; content: string | null };
};

export type ContentTypeResearchRun = Omit<WorkflowRun, 'result'> & {
  result: ContentTypeResearchResult | null;
};

export const getContentTypeResearch = async (
  businessId: string,
  workflowRunId: string,
): Promise<ContentTypeResearchRun | null> => {
  const headers = await getAuthHeaders();

  return api.get<ContentTypeResearchRun | null>(
    `/businesses/${businessId}/workflow-runs/${workflowRunId}`,
    { headers },
  );
};

export const getContentTypeResearchQueryOptions = (
  businessId: string,
  workflowRunId: string,
) =>
  queryOptions({
    queryKey: brandKitKeys.contentTypeResearch(businessId, workflowRunId),
    queryFn: () => getContentTypeResearch(businessId, workflowRunId),
    enabled: Boolean(businessId && workflowRunId),
  });

type UseGetContentTypeResearchOptions = {
  queryConfig?: QueryConfig<typeof getContentTypeResearchQueryOptions>;
};

export const useGetContentTypeResearch = (
  businessId: string,
  workflowRunId: string,
  { queryConfig }: UseGetContentTypeResearchOptions = {},
) =>
  useQuery({
    ...getContentTypeResearchQueryOptions(businessId, workflowRunId),
    ...queryConfig,
  });
