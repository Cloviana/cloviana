'use client';

import { PlusIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Page,
  PageContent,
  PageHeader,
  PageParagraph,
  PageTitle,
} from '@/components/ui/page';
import { paths } from '@/config/paths';
import { useCreateBlog } from '@/features/blogs/api/create-blog';
import { EmptyBlogList } from '@/features/blogs/components/states/empty-blog-list';

export default function ContentCreationPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { mutateAsync: createBlog, isPending: isCreating } = useCreateBlog();
  const { push } = useRouter();

  const handleCreateBlog = async () => {
    const { id } = await createBlog({
      data: { storeId },
    });
    push(paths.store.blogs.getHref(storeId, id));
  };

  return (
    <Page>
      <PageHeader>
        <PageTitle>Content Creation</PageTitle>
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <PageParagraph>
            Connect your Shopify store to let Cloviana fully work with your
            shop. You can also link Google Console to help your pages get found
            faster and reach more customers.
          </PageParagraph>
          <Button
            size={'sm'}
            variant={'brand-secondary'}
            onClick={handleCreateBlog}
            loading={isCreating}
          >
            <span className="flex items-center">
              <PlusIcon className="mr-2 size-3" />
              Add blog post
            </span>
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        <EmptyBlogList />
      </PageContent>
    </Page>
  );
}
