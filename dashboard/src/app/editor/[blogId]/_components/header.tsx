'use client';

import { useParams } from 'next/navigation';

import { Button } from '@/components/actions';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { usePublishBlog } from '@/features/blogs/api/publish-blog';

export const Header = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const { data: blog } = useGetBlog(blogId);
  const { mutateAsync: publish, isPending } = usePublishBlog(
    blogId,
    blog?.storeId ?? '',
  );

  const handlePublish = async () => {
    await publish(blogId);
  };

  return (
    <header className="size-full px-2 py-1">
      <div className="flex size-full items-center justify-between">
        <div className="flex items-center">
          <span className="max-w-lg truncate text-sm font-medium">
            {blog?.title}
          </span>
        </div>
        <div className="flex items-center">
          <Button
            size={'sm'}
            variant={'primary'}
            onClick={handlePublish}
            loading={isPending}
          >
            Publish
          </Button>
        </div>
      </div>
    </header>
  );
};
