'use client';

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Topic } from '@/sanity/queries/posts';

type BlogFiltersProps = {
  topics: Topic[];
  search: string;
  selectedTopics: string[];
  onSearchChange: (value: string) => void;
  onTopicToggle: (slug: string) => void;
};

export const BlogFilters = ({
  topics,
  search,
  selectedTopics,
  onSearchChange,
  onTopicToggle,
}: BlogFiltersProps) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-xl transition-opacity duration-200 hover:opacity-80"
      >
        Topics
        {open ? (
          <ChevronUpIcon className="size-5" />
        ) : (
          <ChevronDownIcon className="size-5" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="topics"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="-m-1 mt-3 flex flex-col gap-3.5 overflow-hidden p-1"
          >
            <ul className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <li key={topic._id}>
                  <Button
                    onClick={() => onTopicToggle(topic.slug)}
                    variant={
                      selectedTopics.includes(topic.slug)
                        ? 'primary'
                        : 'outline'
                    }
                  >
                    {topic.name}
                  </Button>
                </li>
              ))}
            </ul>
            <Input
              type="search"
              value={search}
              size={'lg'}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search articles"
              className="h-10"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
