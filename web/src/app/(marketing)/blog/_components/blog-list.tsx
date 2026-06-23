import type { Post } from '@/sanity/queries/posts';

import { PostCard } from './post-card';

type BlogListProps = {
  posts: Post[];
};

export const BlogList = ({ posts }: BlogListProps) => {
  if (posts.length === 0) return <p>No posts found.</p>;

  return (
    <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <li key={post._id}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
};
