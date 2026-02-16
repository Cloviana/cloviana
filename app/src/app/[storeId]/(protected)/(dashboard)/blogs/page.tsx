'use client';

import { Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Page, PageContent, PageHeader } from '@/components/ui/page';
import { paths } from '@/config/paths';
import { useCreateBlog } from '@/features/blogs/api/create-blog';
import { BlogsList } from '@/features/blogs/components/blogs-list';
import { useGetStore } from '@/features/stores/api/get-store';

export default function BlogsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { mutateAsync: createBlog, isPending: isCreating } = useCreateBlog();
  const { data: store } = useGetStore(storeId);

  const { push } = useRouter();

  const handleCreateBlog = async () => {
    if (store?.status !== 'ACTIVE') return;

    const { id } = await createBlog({
      data: { storeId },
    });
    push(paths.store.blogs.getHref(storeId, id));
  };

  return (
    <Page>
      <PageHeader
        title="Blog posts"
        primaryAction={{
          size: 'default',
          variant: 'secondary',
          loading: isCreating,
          onClick: handleCreateBlog,
          children: (
            <>
              <Plus />
              Create new
            </>
          ),
        }}
      />
      <PageContent>
        <BlogsList />
      </PageContent>
    </Page>
  );
}
