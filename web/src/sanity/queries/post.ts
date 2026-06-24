import { defineQuery } from 'next-sanity';

export type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  _updatedAt: string;
  thumbnail: {
    alt: string;
    asset: {
      url: string;
      metadata: { lqip: string };
    };
  } | null;
  author: {
    name: string;
    slug: string;
    jobTitle: string | null;
    bio: string | null;
    linkedinUrl: string | null;
    image: {
      alt: string;
      asset: { url: string; metadata: { lqip: string } };
    } | null;
  } | null;
  topics: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  content: string;
  faqs: Array<{
    _key: string;
    question: string;
    answer: string;
  }>;
  seo: {
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
  } | null;
};

export const POST_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    thumbnail {
      alt,
      asset->{ url, metadata { lqip } }
    },
    author->{
      name,
      "slug": slug.current,
      jobTitle,
      bio,
      linkedinUrl,
      image {
        alt,
        asset->{ url, metadata { lqip } }
      }
    },
    "topics": coalesce(topics[]->{ _id, name, "slug": slug.current }, []),
    content,
    "faqs": coalesce(faqs[]{ _key, question, answer }, []),
    seo { metaTitle, metaDescription, canonicalUrl, noIndex }
  }
`);

export const POST_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "blogPost"]{ "slug": slug.current }
`);
