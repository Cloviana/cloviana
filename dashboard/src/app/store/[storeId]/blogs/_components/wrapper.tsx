'use client';

import { useParams } from 'next/navigation';

import { Page } from '@/components/layout';
import { paths } from '@/config/paths';
import { useGetBlogs } from '@/features/blogs/api/get-blogs';

import { EmptyBlogList } from './empty-blog-list';

interface WrapperProps {
  children?: React.ReactNode;
}

export const Wrapper = ({ children }: WrapperProps) => {
  const { storeId } = useParams();
  const { isLoading, data: blogs } = useGetBlogs(storeId as string);

  if (isLoading) return null;

  return (
    <Page
      title="Blogs"
      fullWidth={blogs?.length !== 0}
      primaryAction={
        blogs && blogs.length > 0
          ? {
              content: 'Add blog post',
              url: paths.store.blogs.new.getHref(storeId as string),
            }
          : undefined
      }
    >
      {blogs?.length === 0 ? <EmptyBlogList /> : children}
    </Page>
  );
};
