import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { fetchAccessToken } from '@/lib/supabase/fetch-access-token';
import { Blog, BlogType } from '@/types/api';

import { getBlogsKey } from '../keys';

export type CreateBlogData = {
  title: string;
  brandVoice?: string;
  type: BlogType;
  keywordId: string;
  storeId: string;
};

export const createBlog = async ({
  ...payload
}: { storeId: string } & CreateBlogData): Promise<Blog> => {
  const token = await fetchAccessToken();
  if (!token) {
    throw new Error('Access token is missing');
  }
  const response = await api.post<Blog>(`/blogs`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

type UseCreateBlogOptions = {
  config?: UseMutationOptions<Blog, Error, CreateBlogData>;
};

export const useCreateBlog = ({ config }: UseCreateBlogOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation<Blog, Error, CreateBlogData>({
    mutationFn: (data) => createBlog({ ...data }),
    onSuccess: (newBlog, variables, context) => {
      const { storeId } = variables;
      queryClient.setQueryData<Blog[]>(getBlogsKey(storeId), (old = []) => [
        ...old,
        newBlog,
      ]);
      config?.onSuccess?.(newBlog, variables, context);
    },
    ...config,
  });
};
