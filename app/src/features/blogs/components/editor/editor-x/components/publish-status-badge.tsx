import { useParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { useGetBlog } from '@/features/blogs/api/get-blog';

export const PublishStatusBadge = () => {
  const { blogId, storeId } = useParams<{ blogId: string; storeId: string }>();
  const { data: blog } = useGetBlog({ blogId, storeId });

  return (
    <Badge
      variant={blog?.status === 'DRAFT' ? 'warning' : 'success'}
      className="w-min"
    >
      {blog?.status === 'DRAFT' ? 'Unpublished' : 'Published'}
    </Badge>
  );
};
