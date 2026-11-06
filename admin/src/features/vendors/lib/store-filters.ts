import { ActivityIcon } from 'lucide-react';

import type { FilterDefinition, FilterValues } from '@/lib/filters';

import type { StoreListParams, StoreStatus } from '../types/seller';

import { storeStatuses } from './store-statuses';

export const STORES_PAGE_SIZE = 50;

const statusOrder: StoreStatus[] = [
  'ACTIVE',
  'PENDING',
  'SUSPENDED',
  'TERMINATED',
];

export const storeFilters: FilterDefinition[] = [
  {
    id: 'status',
    label: 'Status',
    icon: ActivityIcon,
    pinned: true,
    type: 'single',
    options: statusOrder.map((status) => ({
      value: status,
      label: storeStatuses[status].label,
    })),
  },
];

/** The request parameters for a search, filters and page. */
export function toStoresParams({
  query,
  values,
  page,
}: {
  query: string;
  values: FilterValues;
  page: number;
}): StoreListParams {
  return {
    page,
    pageSize: STORES_PAGE_SIZE,
    q: query.trim() || undefined,
    status: values.status?.[0],
  };
}
