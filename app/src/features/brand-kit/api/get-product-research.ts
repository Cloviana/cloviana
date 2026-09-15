import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { brandKitKeys, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Competitor, WorkflowRun } from '@/types/api';

import type { BrandKitProduct } from '../types';

export type ProductResearchResult = {
  product: BrandKitProduct;
  competitors: Competitor[];
  sources: Array<{ title: string | null; url: string }>;
};

export type ProductResearchRun = Omit<WorkflowRun, 'result'> & {
  result: ProductResearchResult | null;
};

export const getProductResearch = async (
  businessId: string,
  workflowRunId: string,
): Promise<ProductResearchRun | null> => {
  const headers = await getAuthHeaders();

  return api.get<ProductResearchRun | null>(
    `/businesses/${businessId}/workflow-runs/${workflowRunId}`,
    { headers },
  );
};

export const getProductResearchQueryOptions = (
  businessId: string,
  workflowRunId: string,
) =>
  queryOptions({
    queryKey: brandKitKeys.productResearch(businessId, workflowRunId),
    queryFn: () => getProductResearch(businessId, workflowRunId),
    enabled: Boolean(businessId && workflowRunId),
  });

type UseGetProductResearchOptions = {
  queryConfig?: QueryConfig<typeof getProductResearchQueryOptions>;
};

export const useGetProductResearch = (
  businessId: string,
  workflowRunId: string,
  { queryConfig }: UseGetProductResearchOptions = {},
) =>
  useQuery({
    ...getProductResearchQueryOptions(businessId, workflowRunId),
    ...queryConfig,
  });
