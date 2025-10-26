import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

export type SyncStateData = {
  storeId: string;
  blogId: string;
  state: SerializedEditorState<SerializedLexicalNode>;
};

export type SyncNodesData = SyncStateData;

export const syncNodes = async ({
  storeId,
  blogId,
  state,
}: SyncStateData): Promise<void> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }
  await api.put<void>(
    `/stores/${storeId}/blogs/${blogId}/nodes/sync`,
    { state },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

type UseSyncNodesOptions = {
  config?: UseMutationOptions<void, Error, SyncStateData>;
};

export const useSyncNodes = ({ config }: UseSyncNodesOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, SyncStateData>({
    mutationFn: syncNodes,
    onSuccess: (_data, { storeId, blogId }) => {
      queryClient.invalidateQueries({
        queryKey: ['blogs', 'detail', storeId, blogId],
      });
    },
    ...config,
  });
};
