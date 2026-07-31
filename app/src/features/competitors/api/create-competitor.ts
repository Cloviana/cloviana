import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { competitorKeys, MutationConfig } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import type { Competitor } from '@/types/api';

export type CreateCompetitorInput = {
  businessId: string;
  name: string;
  domain: string;
  aliases: string[];
};

export const createCompetitor = async ({
  businessId,
  ...competitor
}: CreateCompetitorInput): Promise<Competitor> => {
  const headers = await getAuthHeaders();

  return api.post<Competitor>(
    `/businesses/${businessId}/competitors`,
    competitor,
    { headers },
  );
};

type UseCreateCompetitorOptions = {
  mutationConfig?: MutationConfig<typeof createCompetitor>;
};

export const useCreateCompetitor = ({
  mutationConfig,
}: UseCreateCompetitorOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompetitor,
    ...mutationConfig,
    onSuccess: (...args) => {
      const competitor = args[0];
      const { businessId } = args[1];

      queryClient.setQueryData<Competitor[]>(
        competitorKeys.list(businessId),
        (competitors) => [...(competitors ?? []), competitor],
      );
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
