import 'server-only';

import { sanityClient } from './client';
import {
  FEATURED_POST_QUERY,
  type FeaturedPost,
} from './queries/featured-post';
import { POST_QUERY, type BlogPost } from './queries/post';
import {
  POSTS_QUERY,
  RELATED_POSTS_QUERY,
  TOPICS_QUERY,
  type Post,
  type Topic,
} from './queries/posts';
import { SITEMAP_POSTS_QUERY, type SitemapPost } from './queries/sitemap';

const contentOptions = { next: { revalidate: 60 } };

export function getFeaturedPost() {
  return sanityClient.fetch<FeaturedPost | null>(
    FEATURED_POST_QUERY,
    {},
    contentOptions,
  );
}

export function listPosts(featuredId: string) {
  return sanityClient.fetch<Post[]>(
    POSTS_QUERY,
    { featuredId },
    contentOptions,
  );
}

export function listTopics() {
  return sanityClient.fetch<Topic[]>(TOPICS_QUERY, {}, contentOptions);
}

export function getPost(slug: string) {
  return sanityClient.fetch<BlogPost | null>(
    POST_QUERY,
    { slug },
    contentOptions,
  );
}

export function listRelatedPosts(currentId: string, topicIds: string[]) {
  return sanityClient.fetch<Post[]>(
    RELATED_POSTS_QUERY,
    { currentId, topicIds },
    contentOptions,
  );
}

export function listSitemapPosts() {
  return sanityClient.fetch<SitemapPost[]>(SITEMAP_POSTS_QUERY);
}
