import type { Metadata } from 'next';
import { Fragment } from 'react';

import { sanityClient } from '@/sanity/client';
import {
  FEATURED_POST_QUERY,
  type FeaturedPost,
} from '@/sanity/queries/featured-post';
import {
  POSTS_QUERY,
  TOPICS_QUERY,
  type Post,
  type Topic,
} from '@/sanity/queries/posts';

import { BlogFeed } from './_components/blog-feed';
import { Featured } from './_components/featured';

export const metadata: Metadata = {
  title: 'Blog — Cloviana',
  description:
    'Research, playbooks, and GEO strategy for B2B brands building visibility in ChatGPT, Perplexity, and Google AI Overviews.',
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const featuredPost = await sanityClient.fetch<FeaturedPost | null>(
    FEATURED_POST_QUERY,
    {},
    { next: { revalidate: 60 } },
  );

  const [posts, topics] = await Promise.all([
    sanityClient.fetch<Post[]>(
      POSTS_QUERY,
      { featuredId: featuredPost?._id ?? '' },
      { next: { revalidate: 60 } },
    ),
    sanityClient.fetch<Topic[]>(TOPICS_QUERY, {}, { next: { revalidate: 60 } }),
  ]);

  return (
    <Fragment>
      {featuredPost && (
        <>
          <Featured post={featuredPost} />
          <section className="padding-global">
            <div className="container">
              <hr />
            </div>
          </section>
        </>
      )}

      <BlogFeed posts={posts} topics={topics} />
    </Fragment>
  );
}
