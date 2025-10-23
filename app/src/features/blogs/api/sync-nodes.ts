import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

import { getBlogKey } from '../keys';

export type SyncStateData = {
  blogId: string;
  state: SerializedEditorState<SerializedLexicalNode>;
};

export type SyncNodesData = SyncStateData;

export const syncNodes = async ({
  blogId,
  state,
}: SyncStateData): Promise<void> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }
  await api.put<void>(
    `/blogs/${blogId}/nodes/sync`,
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
    onSuccess: (_data, { blogId }) => {
      queryClient.invalidateQueries({ queryKey: getBlogKey(blogId) });
    },
    ...config,
  });
};
