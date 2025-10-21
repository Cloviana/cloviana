import { useParams } from 'next/navigation';

import { GIcon } from '@/components/deprecated/icons';
import { useGetBlog } from '@/features/blogs/_api/get-blog';

export const Keyword = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const { data: blog } = useGetBlog(blogId);

  return (
    <div className="text-foreground-light flex items-center gap-2 text-base">
      <GIcon name="key" size={17} className="-rotate-45" />
      <span>{blog?.keyword?.phrase}</span>
    </div>
  );
};
