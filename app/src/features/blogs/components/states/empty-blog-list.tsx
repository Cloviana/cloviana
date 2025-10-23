import { Codepen } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function EmptyBlogList() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia>
          <Codepen className="text-foreground-light size-8" />
        </EmptyMedia>
        <EmptyTitle>Publish your first blog post</EmptyTitle>
        <EmptyDescription>
          Blog posts boost your store’s SEO and power answer-engine
          optimization.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
