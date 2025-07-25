import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';

import { getBlogKey } from '../keys';

export type DeleteNodeData = {
  blogId: string;
  key: string;
};

export const deleteNode = async ({
  blogId,
  key,
}: DeleteNodeData): Promise<void> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }
  await api.delete<void>(`/blogs/${blogId}/nodes`, {
    params: { key },
    headers: { Authorization: `Bearer ${token}` },
  });
};

type UseDeleteNodeOptions = {
  config?: UseMutationOptions<void, Error, DeleteNodeData>;
};

export const useDeleteNode = ({ config }: UseDeleteNodeOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteNodeData>({
    mutationFn: deleteNode,
    onSuccess: (_data, { blogId }) => {
      queryClient.invalidateQueries({ queryKey: getBlogKey(blogId) });
    },
    ...config,
  });
};
