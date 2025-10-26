import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Blog, BlogDetail } from '@/types/api';

export const publishBlog = async (storeId: string, blogId: string) => {
  const token = await fetchAccessToken();
  if (!token) throw new Error('Access token is missing');
  await api.put(
    `/stores/${storeId}/blogs/${blogId}/publish`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
};

type UsePublishBlogOptions = {
  config?: MutationConfig<typeof publishBlog>;
};

export const usePublishBlog = (
  storeId: string,
  blogId: string,
  { config }: UsePublishBlogOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publishBlog(storeId, blogId),
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<BlogDetail>(
        ['blogs', 'detail', storeId, blogId],
        (old) => (old ? { ...old, publishStatus: 'PUBLISHED' } : old),
      );

      queryClient.setQueryData<Blog[]>(['blogs', 'list', storeId], (old) =>
        old
          ? old.map((b) =>
              b.id === blogId ? { ...b, publishStatus: 'PUBLISHED' } : b,
            )
          : old,
      );

      config?.onSuccess?.(data, variables, context);
    },
    ...config,
  });
};
