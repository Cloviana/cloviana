import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { competitorKeys, MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Competitor } from '@/types/api';

type DeleteCompetitorInput = {
  businessId: string;
  competitorId: string;
};

export const deleteCompetitor = async ({
  businessId,
  competitorId,
}: DeleteCompetitorInput): Promise<void> => {
  const headers = await getAuthHeaders();

  return api.delete(`/businesses/${businessId}/competitors/${competitorId}`, {
    headers,
  });
};

type UseDeleteCompetitorOptions = {
  mutationConfig?: MutationConfig<typeof deleteCompetitor>;
};

export const useDeleteCompetitor = ({
  mutationConfig,
}: UseDeleteCompetitorOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompetitor,
    ...mutationConfig,
    onSuccess: (...args) => {
      const { businessId, competitorId } = args[1];

      queryClient.setQueryData<Competitor[]>(
        competitorKeys.list(businessId),
        (competitors) =>
          competitors?.filter((competitor) => competitor.id !== competitorId),
      );
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
