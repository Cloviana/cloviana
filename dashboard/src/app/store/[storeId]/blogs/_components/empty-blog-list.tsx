'use client';

import { FC } from 'react';

import { InboxIcon } from '@/components/icons';
import { Button } from '@/components/legacy';

interface EmptyBlogListProps {
  onCreate: () => void;
  loading: boolean;
}

export const EmptyBlogList: FC<EmptyBlogListProps> = ({
  onCreate,
  loading,
}) => (
  <div className="flex w-full items-center justify-center rounded-md border bg-white px-6 py-12 shadow-inner">
    <div className="w-full max-w-2xl space-y-6">
      <InboxIcon className="mx-auto size-14 fill-foreground-light" />
      <div className="space-y-2 text-center">
        <h6 className="text-sm font-semibold">Publish your first blog post</h6>
        <p className="text-[13px] text-foreground-light">
          Blog posts boost your store’s SEO and power answer-engine optimization
          by supplying search engines and AI assistants with fresh, keyword-rich
          content. Use them to share insights, tutorials, and updates that
          engage customers and improve your search rankings.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mx-auto"
          onClick={onCreate}
          loading={loading}
        >
          Create Blog post
        </Button>
      </div>
    </div>
  </div>
);
