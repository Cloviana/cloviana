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

import { BlogList } from './_components/blog-list';

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
            Create product-led blog posts that rank on Google and bring shoppers
            to your store. Every article is optimized to boost visibility, build
            trust, and convert traffic into sales.
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
        <BlogList />
      </PageContent>
    </Page>
  );
}
