import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { getCategoryAction } from './actions/get-category';
import { getCategoryImpactAction } from './actions/get-category-impact';
import { listCategoriesAction } from './actions/list-categories';
import type { CategoryListParams } from './types';

const CACHE_TIME = 60 * 60 * 1000;

export const categoryKeys = {
  all: (slug: string) => ['categories', slug] as const,
  lists: (slug: string) => [...categoryKeys.all(slug), 'list'] as const,
  list: (slug: string, params: CategoryListParams) =>
    [...categoryKeys.lists(slug), params] as const,
  pages: (slug: string, params: CategoryListParams) =>
    [...categoryKeys.list(slug, params), 'pages'] as const,
  detail: (slug: string, id: string, includeHidden = false) =>
    [
      ...categoryKeys.all(slug),
      'detail',
      id,
      includeHidden ? 'all' : 'visible',
    ] as const,
  impact: (slug: string, id: string) =>
    [...categoryKeys.all(slug), 'impact', id] as const,
};

function normalizeCategoryParams(input: CategoryListParams) {
  const search = input.search?.trim().toLowerCase() || undefined;
  return {
    parentId: input.parentId?.toLowerCase(),
    search,
    // Left out when false, so the product picker keeps its own cache entries.
    includeHidden: input.includeHidden || undefined,
    limit: input.limit ?? (search ? 20 : 50),
    offset: input.offset ?? 0,
  };
}

export const categoriesQueryOptions = (
  slug: string,
  input: CategoryListParams = {},
) => {
  const params = normalizeCategoryParams(input);

  return queryOptions({
    queryKey: categoryKeys.list(slug, params),
    queryFn: () => listCategoriesAction(slug, params),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
  });
};

export const categoryPagesQueryOptions = (
  slug: string,
  input: Omit<CategoryListParams, 'offset'> = {},
) => {
  const params = normalizeCategoryParams({ ...input, offset: 0 });
  return infiniteQueryOptions({
    queryKey: categoryKeys.pages(slug, params),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listCategoriesAction(slug, { ...params, offset: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
  });
};

export const categoryQueryOptions = (
  slug: string,
  id: string,
  { includeHidden = false }: { includeHidden?: boolean } = {},
) => {
  const categoryId = id.toLowerCase();
  return queryOptions({
    queryKey: categoryKeys.detail(slug, categoryId, includeHidden),
    queryFn: () => getCategoryAction(slug, categoryId, { includeHidden }),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
  });
};

// What deleting the category also removes. Never served stale: it is read just before a delete.
export const categoryImpactQueryOptions = (slug: string, id: string) =>
  queryOptions({
    queryKey: categoryKeys.impact(slug, id.toLowerCase()),
    queryFn: () => getCategoryImpactAction(slug, id.toLowerCase()),
    staleTime: 0,
    gcTime: 0,
  });
