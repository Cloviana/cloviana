import { ShapesIcon } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function CategoriesEmptyState() {
  return (
    <Empty className="bg-transparent">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShapesIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>There aren't any categories here... yet!</EmptyTitle>
        <EmptyDescription>
          Categories group your products so customers can browse them.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
