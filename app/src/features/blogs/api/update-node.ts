import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Node } from '@/types/api';

import { getBlogKey } from '../keys';

export type UpdateNodeData = Node & {
  blogId: string;
};

export const updateNode = async ({
  blogId,
  ...payload
}: UpdateNodeData): Promise<Node> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }
  const response = await api.patch<Node>(`/blogs/${blogId}/nodes`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

type UseUpdateNodeOptions = {
  config?: UseMutationOptions<Node, Error, UpdateNodeData>;
};

export const useUpdateNode = ({ config }: UseUpdateNodeOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation<Node, Error, UpdateNodeData>({
    mutationFn: updateNode,
    onSuccess: (_node, { blogId }) => {
      queryClient.invalidateQueries({ queryKey: getBlogKey(blogId) });
    },
    ...config,
  });
};
