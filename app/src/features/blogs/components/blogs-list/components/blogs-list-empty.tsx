'use client';

import { Container, Plus, Search } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { paths } from '@/config/paths';
import { useCreateBlog } from '@/features/blogs/api/create-blog';
import { useBlogsListQuery } from '@/features/blogs/components/blogs-list/hooks/use-blogs-list-query';
import { useGetStore } from '@/features/stores/api/get-store';

export const BlogsListEmpty = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { push } = useRouter();

  const { clearFilters, hasActiveFilters } = useBlogsListQuery();

  const { mutateAsync: createBlog, isPending: isCreating } = useCreateBlog();
  const { data: store } = useGetStore(storeId);

  const handleCreateBlog = async () => {
    if (store?.status !== 'ACTIVE') return;

    const { id } = await createBlog({
      data: { storeId },
    });
    push(paths.store.blogs.getHref(storeId, id));
  };

  if (hasActiveFilters) {
    return (
      <Empty className="h-[300px]">
        <EmptyMedia variant="icon">
          <Search strokeWidth={2.4} />
        </EmptyMedia>

        <EmptyHeader>
          <EmptyTitle>No results found</EmptyTitle>
          <EmptyDescription>
            Adjust your search or clear it and try again.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Button size="default" variant="outline" onClick={clearFilters}>
            Clear Search
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Empty className="h-[300px]">
      <EmptyMedia variant="default">
        <Container strokeWidth={2.4} />
      </EmptyMedia>

      <EmptyHeader>
        <EmptyTitle>You haven't created a Blog yet</EmptyTitle>
        <EmptyDescription>
          Generate your first blog and start publishing.
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <Button
          size="default"
          variant="secondary"
          loading={isCreating}
          onClick={handleCreateBlog}
        >
          <Plus className="mr-2 size-4" />
          Create new
        </Button>
      </EmptyContent>
    </Empty>
  );
};
