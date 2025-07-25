import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Node } from '@/types/api';

import { getBlogKey } from '../keys';

export type SyncNodesData = {
  blogId: string;
  nodes: Node[];
};

export const syncNodes = async ({
  blogId,
  nodes,
}: SyncNodesData): Promise<void> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }
  await api.put<void>(
    `/blogs/${blogId}/nodes/sync`,
    { nodes },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

type UseSyncNodesOptions = {
  config?: UseMutationOptions<void, Error, SyncNodesData>;
};

export const useSyncNodes = ({ config }: UseSyncNodesOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SyncNodesData>({
    mutationFn: syncNodes,
    onSuccess: (_data, { blogId }) => {
      queryClient.invalidateQueries({ queryKey: getBlogKey(blogId) });
    },
    ...config,
  });
};
