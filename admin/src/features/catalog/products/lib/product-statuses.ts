import type { ComponentProps } from 'react';

import type { Badge } from '@/components/ui/badge';

import type { ProductStatus } from '../types';

export const productStatuses: Record<
  ProductStatus,
  { label: string; variant: ComponentProps<typeof Badge>['variant'] }
> = {
  DRAFT: { label: 'Draft', variant: 'information' },
  PROPOSED: { label: 'Proposed', variant: 'warning' },
  PUBLISHED: { label: 'Active', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  UNLISTED: { label: 'Unlisted', variant: 'muted' },
  ARCHIVED: { label: 'Archived', variant: 'muted' },
};
