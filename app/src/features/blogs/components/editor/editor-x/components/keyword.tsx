import { Key } from 'lucide-react';
import { useParams } from 'next/navigation';

import { useGetBlog } from '@/features/blogs/api/get-blog';

export const Keyword = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const { data: blog } = useGetBlog({ blogId });

  return (
    <div className="text-foreground-light flex items-center gap-2 text-base">
      <Key size={14} />
      <span>{blog?.primaryKeyword}</span>
    </div>
  );
};
