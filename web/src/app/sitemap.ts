import { MetadataRoute } from 'next';

import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { listSitemapPosts } from '@/sanity/blog-content';

export const dynamic = 'force-dynamic';

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listSitemapPosts();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${env.WEB_URL}${paths.blog.post.getHref(post.slug)}`,
    lastModified: new Date(post._updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: env.WEB_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${env.WEB_URL}${paths.blog.getHref()}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...postEntries,
  ];
}
