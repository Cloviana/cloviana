'use client';

import { Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Page, PageContent, PageHeader, PageTitle } from '@/components/ui/page';
import { paths } from '@/config/paths';
import { useCreateBlog } from '@/features/blogs/api/create-blog';
import { BlogsTable } from '@/features/blogs/components/blogs-table';
import { useGetStore } from '@/features/stores/api/get-store';

import { ShopifyButton } from './_components/shopify-button';

export default function BlogsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { mutateAsync: createBlog, isPending: isCreating } = useCreateBlog();
  const { data: store } = useGetStore(storeId);

  const { push } = useRouter();

  const handleCreateBlog = async () => {
    if (!store?.channel?.shop) return;

    const { id } = await createBlog({
      data: { storeId },
    });
    push(paths.store.blogs.getHref(storeId, id));
  };

  return (
    <Page fullWidth>
      <PageHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PageTitle>Content</PageTitle>
          <div className="flex w-full flex-1 flex-col items-stretch justify-end gap-3.5 sm:flex-row sm:items-center">
            <ShopifyButton />
            <Button
              size={'default'}
              variant={'secondary'}
              disabled={isCreating}
              onClick={handleCreateBlog}
            >
              <Plus />
              Create new
            </Button>
          </div>
        </div>
      </PageHeader>
      <PageContent>
        <BlogsTable />
      </PageContent>
    </Page>
  );
}
