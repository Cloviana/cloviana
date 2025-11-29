'use client';

import { Container, LucideIcon, Plus, Search } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { useCreateBlog } from '@/features/blogs/api/create-blog';
import { useBlogsTableQuery } from '@/features/blogs/components/blogs-table/hooks/use-blogs-table-query';
import { useGetStore } from '@/features/stores/api/get-store';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action: React.ReactNode;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) => (
  <div className="border-black-200 bg-black-50 flex h-[300px] w-full items-center justify-center rounded-lg border">
    <div className="flex max-w-xl flex-col items-center gap-3 text-center">
      <Icon className="text-black-800 size-6" strokeWidth={2.5} />
      <h2 className="text-xl font-medium">{title}</h2>
      <p className="text-foreground-lighter text-sm">{description}</p>
      {action}
    </div>
  </div>
);

export const BlogTableEmpty = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { push } = useRouter();

  const { clearFilters, hasActiveFilters } = useBlogsTableQuery();

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
      <EmptyState
        icon={Search}
        title="No results found"
        description="Adjust your filters or clear your search and try again."
        action={
          <Button size="default" variant="outline" onClick={clearFilters}>
            Clear Search
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={Container}
      title="You haven't created a Blog yet"
      description="You've started up and it's time to start selling! Create a pipeline to manage your sales process."
      action={
        <Button
          size="default"
          variant="outline"
          disabled={isCreating}
          onClick={handleCreateBlog}
        >
          <Plus className="mr-2 size-4" />
          Create new
        </Button>
      }
    />
  );
};
