import type { Metadata } from 'next';
import { Fragment } from 'react';

import { getFeaturedPost, listPosts, listTopics } from '@/sanity/blog-content';

import { BlogFeed } from './_components/blog-feed';
import { Featured } from './_components/featured';

export const metadata: Metadata = {
  title: 'Blog — Cloviana',
  description:
    'Research, playbooks, and GEO strategy for B2B brands building visibility in ChatGPT, Perplexity, and Google AI Overviews.',
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const featuredPost = await getFeaturedPost();
  const [posts, topics] = await Promise.all([
    listPosts(featuredPost?._id ?? ''),
    listTopics(),
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
