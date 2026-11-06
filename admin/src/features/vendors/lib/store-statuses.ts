import type { ComponentProps } from 'react';

import type { Badge } from '@/components/ui/badge';

import type { StoreStatus } from '../types/seller';

export const storeStatuses: Record<
  StoreStatus,
  { label: string; variant: ComponentProps<typeof Badge>['variant'] }
> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  PENDING: { label: 'Pending', variant: 'warning' },
  SUSPENDED: { label: 'Inactive', variant: 'muted' },
  TERMINATED: { label: 'Terminated', variant: 'danger' },
};
