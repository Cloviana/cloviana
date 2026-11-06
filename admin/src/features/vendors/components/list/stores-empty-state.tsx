import { StoreIcon } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function StoresEmptyState() {
  return (
    <Empty className="bg-transparent">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <StoreIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>There aren't any stores here... yet!</EmptyTitle>
        <EmptyDescription>
          Add a store and invite its admin. They can then sign in and list
          offers on your marketplace.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
