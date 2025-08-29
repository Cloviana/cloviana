'use client';

import { useParams, useRouter } from 'next/navigation';

import { useCreateBlog } from '@/api/blogs/create-blog';
import { Page } from '@/components/legacy';
import { paths } from '@/config/paths';
import { useGetBlogs } from '@/features/blogs/api/get-blogs';

import { DashboardShell } from '../_components/dashboard-shell';

import { BlogsTable } from './_components/blogs-table';
import { EmptyBlogList } from './_components/empty-blog-list';

export default function BlogListPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();

  const { data: blogs = [] } = useGetBlogs(storeId);
  const { mutateAsync: createBlog, isPending: isCreating } = useCreateBlog();

  const handleCreateBlog = async () => {
    const { id } = await createBlog({
      data: { storeId },
    });
    router.push(paths.store.blogs.setup.getHref(storeId, id));
  };

  const hasBlogs = blogs.length > 0;

  if (!storeId) return null;

  return (
    <DashboardShell>
      <Page
        title="Blogs"
        fullWidth={hasBlogs}
        primaryAction={
          hasBlogs
            ? {
                children: 'Add blog post',
                onClick: handleCreateBlog,
                loading: isCreating,
              }
            : undefined
        }
      >
        {hasBlogs ? (
          <BlogsTable blogs={blogs} />
        ) : (
          <EmptyBlogList onCreate={handleCreateBlog} loading={isCreating} />
        )}
      </Page>
    </DashboardShell>
  );
}
