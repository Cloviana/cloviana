import { defineQuery } from 'next-sanity';

export type Post = {
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
      metadata: { lqip: string };
    };
  } | null;
  author: {
    name: string;
    slug: string;
  } | null;
  topics: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
};

export type Topic = {
  _id: string;
  name: string;
  slug: string;
};

export const POSTS_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost" && _id != $featuredId] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    thumbnail {
      alt,
      asset->{ _id, url, metadata { lqip } }
    },
    author->{ name, "slug": slug.current },
    "topics": coalesce(topics[]->{ _id, name, "slug": slug.current }, [])
  }
`);

export const RELATED_POSTS_QUERY = defineQuery(/* groq */ `
  *[
    _type == "blogPost" &&
    _id != $currentId &&
    count((topics[]->_id)[@ in $topicIds]) > 0
  ] | order(publishedAt desc) [0..2] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    thumbnail {
      alt,
      asset->{ _id, url, metadata { lqip } }
    },
    author->{ name, "slug": slug.current },
    "topics": coalesce(topics[]->{ _id, name, "slug": slug.current }, [])
  }
`);

export const TOPICS_QUERY = defineQuery(/* groq */ `
  *[_type == "topic"] | order(name asc) {
    _id,
    name,
    "slug": slug.current
  }
`);
