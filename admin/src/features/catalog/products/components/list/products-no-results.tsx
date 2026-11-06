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

/** Shown when the search and filters match nothing, as opposed to the marketplace having no products. */
export function ProductsNoResults({ onClear }: { onClear: () => void }) {
  return (
    <Empty className="bg-transparent">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No results found</EmptyTitle>
        <EmptyDescription className="break-words">
          Try adjusting your filters to see more content
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="secondary" onClick={onClear}>
          Clear search and filters
        </Button>
      </EmptyContent>
    </Empty>
  );
}
