import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { BlogDetail } from '@/types/api';

import { getBlogKey } from '../keys';

export type UpdateBlogData = {
  slug?: string;
  title?: string;
  description?: string;
};

export const updateBlog = async ({
  blogId,
  ...payload
}: { blogId: string } & UpdateBlogData): Promise<UpdateBlogData> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }
  await api.patch(`/blogs/${blogId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return payload;
};

type UseUpdateBlogOptions = {
  config?: UseMutationOptions<UpdateBlogData, Error, UpdateBlogData>;
};

export const useUpdateBlog = (
  blogId: string,
  { config }: UseUpdateBlogOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateBlogData, Error, UpdateBlogData>({
    mutationFn: (data) => updateBlog({ blogId, ...data }),
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<BlogDetail>(getBlogKey(blogId), (old) => ({
        ...old!,
        ...variables,
      }));
      config?.onSuccess?.(data, variables, context);
    },
    ...config,
  });
};
