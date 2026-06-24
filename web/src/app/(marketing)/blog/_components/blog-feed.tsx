'use client';

import { useState } from 'react';

import type { Post, Topic } from '@/sanity/queries/posts';

import { BlogFilters } from './blog-filters';
import { BlogList } from './blog-list';

type BlogFeedProps = {
  posts: Post[];
  topics: Topic[];
};

export const BlogFeed = ({ posts, topics }: BlogFeedProps) => {
  const [search, setSearch] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (slug: string) => {
    setSelectedTopics((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const filtered = posts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesTopics =
      selectedTopics.length === 0 ||
      post.topics.some((t) => selectedTopics.includes(t.slug));

    return matchesSearch && matchesTopics;
  });

  return (
    <section className="padding-global">
      <div className="padding-section-small container space-y-8">
        <BlogFilters
          topics={topics}
          search={search}
          selectedTopics={selectedTopics}
          onSearchChange={setSearch}
          onTopicToggle={toggleTopic}
        />
        <BlogList posts={filtered} />
      </div>
    </section>
  );
};
