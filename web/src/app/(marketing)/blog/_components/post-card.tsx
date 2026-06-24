import Image from 'next/image';
import Link from 'next/link';

import { paths } from '@/config/paths';
import type { Post } from '@/sanity/queries/posts';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

type PostCardProps = {
  post: Post;
};

export const PostCard = ({ post }: PostCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-lg">
      <Link href={paths.blog.post.getHref(post.slug)}>
        {post.thumbnail && (
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image
              src={post.thumbnail.asset.url}
              alt={post.thumbnail.alt}
              fill
              placeholder="blur"
              blurDataURL={post.thumbnail.asset.metadata.lqip}
              className="object-cover"
            />
          </div>
        )}
        <h4 className="font-gambarino mt-3 line-clamp-2 text-lg">
          {post.title}
        </h4>
        <p className="text-foreground-lighter mt-2 text-sm">
          {dateFormatter.format(new Date(post.publishedAt))}
        </p>
        <div className="bg-surface absolute inset-0 flex flex-col gap-2 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <h4 className="font-gambarino line-clamp-2 text-lg">{post.title}</h4>
          <p className="line-clamp-4 text-sm">{post.excerpt}</p>
        </div>
      </Link>
    </div>
  );
};
