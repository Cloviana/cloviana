'use client';

import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useJobWatcher } from '@/hooks/use-job-watcher';
import type { JobStatus } from '@/types/api';

export function useBlogGeneration(blogId: string, storeId: string) {
  const { data: blog, refetch: refetchBlog } = useGetBlog({ blogId, storeId });

  const watcher = useJobWatcher({
    storeId: blog?.storeId,
    jobId: blog?.jobId,
    initialStatus: blog?.job?.status as JobStatus,
    onSuccess: async () => {
      await refetchBlog();
    },
  });

  return { blog, ...watcher };
}
