import { PackageIcon } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function ProductsEmptyState() {
  return (
    <Empty className="bg-transparent">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>There aren't any products here... yet!</EmptyTitle>
        <EmptyDescription>
          Add a new product to start building your catalog. Sellers can then
          list their offers on it.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
