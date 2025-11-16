'use client';

import { Wand2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { useGetStore } from '@/api/stores/get-store';
import { Button } from '@/components/ui/button';
import {
  Page,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
} from '@/components/ui/page';
import { paths } from '@/config/paths';
import { useCreateBlog } from '@/features/blogs/api/create-blog';

import { BlogsTable } from './_components/blogs-table';
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
    <Page>
      <PageHeader className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="space-y-1">
          <PageTitle>Blog Posts</PageTitle>
          <PageDescription>
            Create SEO-optimized content that drives real traffic and makes your
            products the answer to customer searches.
          </PageDescription>
        </div>
        <div className="flex items-center gap-3.5">
          <ShopifyButton />
          <Button
            variant={'secondary'}
            size={'sm'}
            loading={isCreating}
            onClick={handleCreateBlog}
          >
            <Wand2 />
            Create new
          </Button>
        </div>
      </PageHeader>
      <PageContent>
        <BlogsTable />
      </PageContent>
    </Page>
  );
}
