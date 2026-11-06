import { SearchXIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

/** Shown when the search matches nothing, as opposed to the marketplace having no categories. */
export function CategoriesNoResults({ onClear }: { onClear: () => void }) {
  return (
    <Empty className="bg-transparent">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No categories found</EmptyTitle>
        <EmptyDescription>
          Try a different search to see more categories.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="secondary" onClick={onClear}>
          Clear search
        </Button>
      </EmptyContent>
    </Empty>
  );
}
