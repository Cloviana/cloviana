import Image from 'next/image';

import type { FeaturedPost } from '@/sanity/queries/featured-post';

type FeaturedProps = {
  post: FeaturedPost | null;
};

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const Featured = ({ post }: FeaturedProps) => {
  if (!post) return null;

  return (
    <section className="padding-global border-border border-b">
      <div className="container py-12 md:py-16 lg:py-20">
        <article className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)] lg:items-center">
          {post.thumbnail && (
            <div className="bg-hero-surface border-hero-surface-border relative min-h-[19rem] overflow-hidden rounded-xl border shadow-sm md:aspect-[16/7] md:min-h-0">
              <Image
                src={post.thumbnail.asset.url}
                alt={post.thumbnail.alt}
                fill
                priority
                sizes="(min-width: 1024px) 65vw, 100vw"
                className="object-cover object-center"
              />
            </div>
          )}

          <div className="flex flex-col items-start gap-5 lg:pl-6">
            <p className="bg-primary-100 text-primary-dark rounded-md px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase">
              Featured
            </p>
            <h1 className="max-w-lg text-3xl leading-tight font-medium text-balance md:text-4xl">
              {post.title}
            </h1>
            <p className="text-foreground-light max-w-md text-base leading-7">
              {post.excerpt}
            </p>
            <div className="text-foreground-light flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {post.author && <span>{post.author.name}</span>}
              {post.author && <span aria-hidden="true">·</span>}
              <time dateTime={post.publishedAt}>
                {dateFormatter.format(new Date(post.publishedAt))}
              </time>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};
