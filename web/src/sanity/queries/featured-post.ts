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
      metadata: {
        lqip: string;
      };
    };
  } | null;
  author: {
    name: string;
    slug: string;
    jobTitle: string | null;
  } | null;
  topics: Array<{
    _key: string;
    topic: {
      _id: string;
      name: string;
      slug: string;
    } | null;
  }>;
};

export const FEATURED_POST_QUERY = defineQuery(/* groq */ `
  *[_type == "blogSettings" && _id == "blogSettings"][0].featuredPost->{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    thumbnail {
      alt,
      asset->{_id, url, metadata { lqip }}
    },
    author->{
      name,
      "slug": slug.current,
      jobTitle
    },
    "topics": coalesce(
      topics[]{
        _key,
        "topic": @->{
          _id,
          name,
          "slug": slug.current
        }
      },
      []
    )
  }
`);
