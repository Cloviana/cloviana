import Link from 'next/dist/client/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import type { FeaturedPost } from '@/sanity/queries/featured-post';

type FeaturedProps = {
  post: FeaturedPost | null;
};

export const Featured = ({ post }: FeaturedProps) => {
  if (!post) return null;

  return (
    <section className="padding-global">
      <div className="padding-section-small container">
        <article className="flex h-min flex-col xl:flex-row">
          {post.thumbnail && (
            <div className="relative h-43.75 overflow-hidden rounded-lg md:h-60 lg:h-80 xl:h-95 xl:grow">
              <Image
                src={post.thumbnail.asset.url}
                alt={post.thumbnail.alt}
                fill
                priority
                placeholder="blur"
                blurDataURL={post.thumbnail.asset.metadata.lqip}
                className="object-cover"
              />
              <Link
                href={paths.blog.post.getHref(post.slug)}
                className="absolute inset-0"
              />
            </div>
          )}
          <div className="mt-8 flex items-center xl:mt-0 xl:w-86.25">
            <div className="flex flex-col gap-4 xl:px-10">
              <div className="relative h-auto w-full flex-none overflow-visible wrap-break-word whitespace-pre-wrap">
                <h4 className="font-gambarino line-clamp-2 text-[32px]/10">
                  {post.title}
                </h4>
              </div>
              <p className="line-clamp-5 max-w-2xl text-lg">{post.excerpt}</p>
              <Button asChild variant="outline" size={'lg'}>
                <Link href={paths.blog.post.getHref(post.slug)}>Read More</Link>
              </Button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};
