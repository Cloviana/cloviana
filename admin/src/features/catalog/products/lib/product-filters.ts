import { endOfDay, parseISO, startOfDay } from 'date-fns';
import {
  ActivityIcon,
  CirclePlusIcon,
  HandCoinsIcon,
  HistoryIcon,
  ShapesIcon,
} from 'lucide-react';

import type { FilterDefinition, FilterValues } from '@/lib/filters';

import type { ProductListParams, ProductStatus } from '../types';

import { productStatuses } from './product-statuses';

export const PRODUCTS_PAGE_SIZE = 50;

/** The category filter's value for products that have no category. */
export const UNCATEGORIZED = 'none';

const statusOrder: ProductStatus[] = [
  'PUBLISHED',
  'DRAFT',
  'UNLISTED',
  'PROPOSED',
  'REJECTED',
  'ARCHIVED',
];

export const productFilters: FilterDefinition[] = [
  {
    id: 'status',
    label: 'Status',
    icon: ActivityIcon,
    pinned: true,
    type: 'multi',
    options: statusOrder.map((status) => ({
      value: status,
      label: productStatuses[status].label,
    })),
  },
  {
    id: 'category',
    label: 'Category',
    icon: ShapesIcon,
    width: 'lg',
    type: 'combobox',
  },
  {
    id: 'offers',
    label: 'Offers',
    icon: HandCoinsIcon,
    width: 'sm',
    type: 'single',
    options: [
      { value: 'has', label: 'Has offers' },
      { value: 'none', label: 'No offers' },
    ],
  },
  { id: 'updated', label: 'Last updated', icon: HistoryIcon, type: 'date' },
  { id: 'created', label: 'Created', icon: CirclePlusIcon, type: 'date' },
];

/** The request parameters for a search, filters and page. Dates stay as `yyyy-MM-dd` here, so the query key is the same on the server and in the browser. */
export function toProductsParams({
  query,
  values,
  page,
}: {
  query: string;
  values: FilterValues;
  page: number;
}): ProductListParams {
  const [updatedFrom, updatedTo] = values.updated ?? [];
  const [createdFrom, createdTo] = values.created ?? [];
  return {
    page,
    pageSize: PRODUCTS_PAGE_SIZE,
    q: query.trim() || undefined,
    status: values.status?.join(','),
    offers: values.offers?.[0],
    category: values.category?.join(','),
    updatedFrom,
    updatedTo: updatedTo ?? updatedFrom,
    createdFrom,
    createdTo: createdTo ?? createdFrom,
  };
}

/** Turns the `yyyy-MM-dd` dates into the start and end of those days in the browser's time zone. */
export function toRequestParams(params: ProductListParams): ProductListParams {
  const start = (day?: string) =>
    day ? startOfDay(parseISO(day)).toISOString() : undefined;
  const end = (day?: string) =>
    day ? endOfDay(parseISO(day)).toISOString() : undefined;
  return {
    ...params,
    updatedFrom: start(params.updatedFrom),
    updatedTo: end(params.updatedTo),
    createdFrom: start(params.createdFrom),
    createdTo: end(params.createdTo),
  };
}
