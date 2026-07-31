import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { competitorKeys, MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Competitor } from '@/types/api';

type UpdateCompetitorInput = {
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
}: UpdateCompetitorInput): Promise<Competitor> => {
  const headers = await getAuthHeaders();

  return api.patch<Competitor>(
    `/businesses/${businessId}/competitors/${competitorId}`,
    update,
    { headers },
  );
};

type UseUpdateCompetitorOptions = {
  mutationConfig?: MutationConfig<typeof updateCompetitor>;
};

export const useUpdateCompetitor = ({
  mutationConfig,
}: UseUpdateCompetitorOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCompetitor,
    ...mutationConfig,
    onSuccess: (...args) => {
      const updatedCompetitor = args[0];
      const { businessId } = args[1];

      queryClient.setQueryData<Competitor[]>(
        competitorKeys.list(businessId),
        (competitors) =>
          competitors?.map((competitor) =>
            competitor.id === updatedCompetitor.id
              ? updatedCompetitor
              : competitor,
          ),
      );
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
