import { defineQuery } from 'next-sanity';

export interface SitemapPost {
  slug: string;
  _updatedAt: string;
}

export const SITEMAP_POSTS_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost" && defined(slug.current) && coalesce(seo.noIndex, false) == false] {
    "slug": slug.current,
    _updatedAt
  }
`);
