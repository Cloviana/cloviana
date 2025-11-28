'use client';

import {
  usePathname,
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { BlogStatus } from '@/types/api';

export const useBlogsTableQuery = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const limit = Number(searchParams.get('limit') ?? '25') || 25;
  const search = searchParams.get('search') || undefined;

  const statusParam = searchParams.get('status');
  const statusUpper = statusParam?.toUpperCase();
  const status =
    statusUpper === 'DRAFT' ||
    statusUpper === 'PUBLISHED' ||
    statusUpper === 'ARCHIVED' ||
    statusUpper === 'UNPUBLISHED'
      ? (statusUpper as BlogStatus)
      : undefined;

  const queryParams = useMemo(
    () => ({ page, limit, search, status }),
    [page, limit, search, status],
  );

  const setQueryParams = useCallback(
    (params: Partial<typeof queryParams>) => {
      const urlSearchParams = new URLSearchParams(searchParams?.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          urlSearchParams.delete(key);
        } else {
          urlSearchParams.set(key, String(value));
        }
      });

      const searchString = urlSearchParams.toString();
      const query = searchString ? `?${searchString}` : '';

      router.push(`${pathname}${query}`);
    },
    [pathname, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    setQueryParams({ search: undefined, status: undefined, page: 1 });
  }, [setQueryParams]);

  const hasActiveFilters = !!search || !!status;

  return {
    storeId,
    page,
    limit,
    search,
    status,
    queryParams,
    setQueryParams,
    clearFilters,
    hasActiveFilters,
  };
};
