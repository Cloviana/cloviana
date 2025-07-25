import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import type { Keyword } from '@/types/api';

import { getKeywordsKey } from './get-keywords'; // your existing file

export type AttachKeywordInput = {
  storeId: string;
  keywordId: string;
  type: 'BLOG' | 'BUSINESS';
};

export const attachKeyword = async ({
  storeId,
  keywordId,
  type,
}: AttachKeywordInput): Promise<Keyword> => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is not available');

  return api.post<Keyword>(
    `/stores/${storeId}/keywords/${keywordId}/attach`,
    { type },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

type UseAttachKeywordOptions = {
  mutationConfig?: MutationConfig<typeof attachKeyword>;
};

export const useAttachKeyword = ({
  mutationConfig,
}: UseAttachKeywordOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = mutationConfig || {};

  return useMutation({
    mutationFn: attachKeyword,
    onSuccess: (data, variables, context) => {
      const key = getKeywordsKey(variables.storeId, { type: variables.type });
      queryClient.setQueryData<Keyword[]>(key, (prev) => {
        if (!prev) return [data];
        const map = new Map(prev.map((k) => [k.id, k]));
        map.set(data.id, data);
        return Array.from(map.values());
      });
      onSuccess?.(data, variables, context);
    },
    ...rest,
  });
};
