import { defineQuery } from 'next-sanity';

export type FeaturedPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  thumbnail: {
    alt: string;
    asset: {
      _id: string;
      url: string;
    };
  } | null;
  author: {
    name: string;
    slug: string;
    jobTitle: string | null;
  } | null;
};

export const FEATURED_POST_QUERY = defineQuery(`
  *[_type == "blogSettings" && _id == "blogSettings"][0].featuredPost->{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    thumbnail {
      alt,
      asset->{_id, url}
    },
    author->{
      name,
      "slug": slug.current,
      jobTitle
    }
  }
`);
