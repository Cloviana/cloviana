import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Blog, BlogDetail } from '@/types/api';

export const publishBlog = async (blogId: string) => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }
  await api.put(
    `/blogs/${blogId}/publish`,
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
  blogId: string,
  storeId: string,
  { config }: UsePublishBlogOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publishBlog(blogId),
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<BlogDetail>(
        ['blogs', 'detail', blogId],
        (old) => (old ? { ...old, publishStatus: 'PUBLISHED' } : old),
      );

      queryClient.setQueryData<Blog[]>(['blogs', 'list', storeId], (old) =>
        old
          ? old.map((b) =>
              b.id === blogId ? { ...b, publishStatus: 'PUBLISHED' } : b,
            )
          : old,
      );

      if (config?.onSuccess) {
        config.onSuccess(data, variables, context);
      }
    },
    ...config,
  });
};
