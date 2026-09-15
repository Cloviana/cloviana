import { MetadataRoute } from 'next';
import { defineQuery } from 'next-sanity';

import { sanityClient } from '@/sanity/client';

export const dynamic = 'force-dynamic';

export const revalidate = 60;

const SITEMAP_POSTS_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost"] {
    "slug": slug.current,
    _updatedAt
  }
`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await sanityClient.fetch(SITEMAP_POSTS_QUERY);

  const postEntries: MetadataRoute.Sitemap = posts.map(
    (post: { slug: string; _updatedAt: string }) => ({
      url: `https://cloviana.com/blog/${post.slug}`,
      lastModified: new Date(post._updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }),
  );

  return [
    {
      url: 'https://cloviana.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://cloviana.com/audits',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://cloviana.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...postEntries,
  ];
}
