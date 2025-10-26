import { Key } from 'lucide-react';
import { useParams } from 'next/navigation';

import { useGetBlog } from '@/features/blogs/api/get-blog';

export const Keyword = () => {
  const { blogId, storeId } = useParams<{ blogId: string; storeId: string }>();
  const { data: blog } = useGetBlog({ blogId, storeId });

  return (
    <div className="text-foreground-light flex items-center gap-2 text-base">
      <Key size={14} />
      <span>{blog?.primaryKeyword}</span>
    </div>
  );
};
