'use client';

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { categoryPagesQueryOptions } from '../queries';
import type { Category } from '../types';

/**
 * One level of the category tree for the dashboard (inactive and internal categories included),
 * loaded a page at a time. Without `parentId` it is the top level; with `search` it is a flat list of matches.
 */
export function useCategoryLevel(
  slug: string,
  params: { parentId?: string; search?: string } = {},
) {
  const query = useInfiniteQuery({
    ...categoryPagesQueryOptions(slug, { ...params, includeHidden: true }),
    // While a search loads, the rows already on screen stay (as placeholder data).
    placeholderData: keepPreviousData,
  });
  const items = useMemo<Category[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  return {
    items,
    isPending: query.isPending,
    isError: query.isError,
    isPlaceholderData: query.isPlaceholderData,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

export type CategoryLevel = ReturnType<typeof useCategoryLevel>;
