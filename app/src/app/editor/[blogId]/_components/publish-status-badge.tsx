import { useParams } from 'next/navigation';

import { Badge } from '@/components/deprecated/indicators';
import { useGetBlog } from '@/features/blogs/api/get-blog';

export const PublishStatusBadge = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const { data: blog } = useGetBlog(blogId);

  return (
    <Badge
      variant={blog?.publishStatus === 'DRAFT' ? 'yellow' : 'green'}
      className="w-min"
    >
      {blog?.publishStatus === 'DRAFT' ? 'Unpublished' : 'Published'}
    </Badge>
  );
};
