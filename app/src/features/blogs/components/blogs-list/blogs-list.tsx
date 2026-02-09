'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useGetBlogs } from '@/features/blogs/api/get-blogs';
import { BlogCard } from '@/features/blogs/components/blogs-list/components/blog-card';
import { BlogsListEmpty } from '@/features/blogs/components/blogs-list/components/blogs-list-empty';
import { BlogsListToolbar } from '@/features/blogs/components/blogs-list/components/blogs-list-toolbar';
import { useBlogsListQuery } from '@/features/blogs/components/blogs-list/hooks/use-blogs-list-query';

import { useCardWidth } from './hooks/use-card-width';

export const BlogsList = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { containerRef, cardWidth } = useCardWidth(250, 12, 2);
  const { q } = useBlogsListQuery();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetBlogs({
    storeId,
    params: { limit: 20, q },
  });

  const blogs = data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (!hasNextPage || isFetching) return;
        fetchNextPage();
      },
      { rootMargin: '300px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching]);

  return (
    <div className="flex w-full flex-col gap-4">
      <BlogsListToolbar />
      <div ref={containerRef} className="flex flex-wrap gap-3">
        {isLoading ? (
          Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ width: cardWidth }} className="space-y-2">
              <Skeleton
                className="w-full rounded-lg"
                style={{ aspectRatio: '16/9' }}
              />
              <div className="space-y-2 px-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))
        ) : blogs.length ? (
          blogs.map((blog) => (
            <div key={blog.id} style={{ width: cardWidth }}>
              <BlogCard data={blog} />
            </div>
          ))
        ) : (
          <div className="w-full">
            <BlogsListEmpty />
          </div>
        )}
      </div>

      <div ref={loadMoreRef} />
      {isFetchingNextPage && (
        <Spinner
          className="text-foreground-light mx-auto mt-6 size-5"
          strokeWidth={3.2}
          variant="2"
        />
      )}
    </div>
  );
};
