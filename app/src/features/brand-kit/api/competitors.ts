import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { competitorKeys, MutationConfig, QueryConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Competitor } from '@/types/api';

import {
  type DraftMutationResult,
  useBrandKitDraftMutation,
} from './brand-kit-draft-mutation';

export const getCompetitors = async (
  businessId: string,
): Promise<Competitor[]> => {
  const headers = await getAuthHeaders();

  return api.get<Competitor[]>(
    `/businesses/${businessId}/brand-kit/competitors`,
    { headers },
  );
};

export const getCompetitorsQueryOptions = (businessId: string) =>
  queryOptions({
    queryKey: competitorKeys.list(businessId),
    queryFn: () => getCompetitors(businessId),
    enabled: Boolean(businessId),
  });

type UseGetCompetitorsOptions = {
  queryConfig?: QueryConfig<typeof getCompetitorsQueryOptions>;
};

export const useGetCompetitors = (
  businessId: string,
  { queryConfig }: UseGetCompetitorsOptions = {},
) =>
  useQuery({
    ...getCompetitorsQueryOptions(businessId),
    ...queryConfig,
  });

export type CreateCompetitorInput = {
  businessId: string;
  id?: string;
  name: string;
  domain: string;
  aliases?: string[];
};

export const createCompetitor = async ({
  businessId,
  ...competitor
}: CreateCompetitorInput): Promise<DraftMutationResult<Competitor>> => {
  const headers = await getAuthHeaders();

  return api.post(
    `/businesses/${businessId}/brand-kit/competitors`,
    competitor,
    { headers },
  );
};

export type UpdateCompetitorInput = {
  businessId: string;
  competitorId: string;
  name?: string;
  domain?: string;
  aliases?: string[];
};

export const updateCompetitor = async ({
  businessId,
  competitorId,
  ...update
}: UpdateCompetitorInput): Promise<DraftMutationResult<Competitor>> => {
  const headers = await getAuthHeaders();

  return api.patch(
    `/businesses/${businessId}/brand-kit/competitors/${competitorId}`,
    update,
    { headers },
  );
};

export type DeleteCompetitorInput = {
  businessId: string;
  competitorId: string;
};

export const deleteCompetitor = async ({
  businessId,
  competitorId,
}: DeleteCompetitorInput): Promise<DraftMutationResult<{ id: string }>> => {
  const headers = await getAuthHeaders();

  return api.delete(
    `/businesses/${businessId}/brand-kit/competitors/${competitorId}`,
    { headers },
  );
};

export const useCreateCompetitor = (
  options: { mutationConfig?: MutationConfig<typeof createCompetitor> } = {},
) => {
  const queryClient = useQueryClient();

  return useBrandKitDraftMutation(createCompetitor, {
    ...options.mutationConfig,
    onSuccess: (...args) => {
      const created = args[0].item;
      const { businessId } = args[1];

      queryClient.setQueryData<Competitor[]>(
        competitorKeys.list(businessId),
        (competitors) => [...(competitors ?? []), created],
      );
      options.mutationConfig?.onSuccess?.(...args);
    },
  });
};

export const useUpdateCompetitor = (
  options: { mutationConfig?: MutationConfig<typeof updateCompetitor> } = {},
) => {
  const queryClient = useQueryClient();

  return useBrandKitDraftMutation(updateCompetitor, {
    ...options.mutationConfig,
    onSuccess: (...args) => {
      const updated = args[0].item;
      const { businessId } = args[1];

      queryClient.setQueryData<Competitor[]>(
        competitorKeys.list(businessId),
        (competitors) =>
          competitors?.map((competitor) =>
            competitor.id === updated.id ? updated : competitor,
          ),
      );
      options.mutationConfig?.onSuccess?.(...args);
    },
  });
};

export const useDeleteCompetitor = (
  options: { mutationConfig?: MutationConfig<typeof deleteCompetitor> } = {},
) => {
  const queryClient = useQueryClient();

  return useBrandKitDraftMutation(deleteCompetitor, {
    ...options.mutationConfig,
    onSuccess: (...args) => {
      const { businessId, competitorId } = args[1];

      queryClient.setQueryData<Competitor[]>(
        competitorKeys.list(businessId),
        (competitors) =>
          competitors?.filter((competitor) => competitor.id !== competitorId),
      );
      options.mutationConfig?.onSuccess?.(...args);
    },
  });
};
