import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Keyword } from '@/types/api';

type FetchKeywordDetailInput = { storeId: string; phrase: string };

export const fetchKeywordDetail = async ({
  storeId,
  phrase,
}: FetchKeywordDetailInput): Promise<Keyword> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');
  return api.get<Keyword>(`/stores/${storeId}/keywords/detail`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { phrase },
  });
};

type UseKeywordDetailOptions = {
  mutationConfig?: MutationConfig<typeof fetchKeywordDetail>;
};

export const useKeywordDetail = ({
  mutationConfig,
}: UseKeywordDetailOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig || {};

  return useMutation({
    mutationFn: fetchKeywordDetail,
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(
        ['store', variables.storeId, 'keyword-detail', variables.phrase],
        data,
      );
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
};
