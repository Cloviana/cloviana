import type { Metadata } from 'next';

import { sanityClient } from '@/sanity/client';
import {
  FEATURED_POST_QUERY,
  type FeaturedPost,
} from '@/sanity/queries/featured-post';

import { Featured } from './_components/featured';

export const metadata: Metadata = {
  title: 'Blog — Cloviana',
  description:
    'Insights from Cloviana on AI search visibility, B2B SaaS discovery, and buyer research behavior.',
};

export default async function BlogPage() {
  const featuredPost = await sanityClient.fetch<FeaturedPost | null>(
    FEATURED_POST_QUERY,
    {},
    { next: { revalidate: 60 } },
  );

  return <Featured post={featuredPost} />;
}
