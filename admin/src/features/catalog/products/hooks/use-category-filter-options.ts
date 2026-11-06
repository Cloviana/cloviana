'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import {
  categoriesQueryOptions,
  categoryQueryOptions,
} from '@/features/catalog/categories';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { FilterOption } from '@/lib/filters';

import { UNCATEGORIZED } from '../lib/product-filters';

/**
 * The category filter's options: "Uncategorized", the selected categories (so the chip can name them),
 * then the top-level categories, or the search results once at least two characters are typed.
 */
export function useCategoryFilterOptions(slug: string, selected: string[]) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 200);
  const term = debounced.length >= 2 ? debounced : undefined;

  const { data: page } = useQuery(
    categoriesQueryOptions(slug, { search: term }),
  );
  const names = useQueries({
    queries: selected
      .filter((id) => id !== UNCATEGORIZED)
      .map((id) => categoryQueryOptions(slug, id, { includeHidden: true })),
  });

  const byId = new Map<string, FilterOption>();
  if (!term)
    byId.set(UNCATEGORIZED, { value: UNCATEGORIZED, label: 'Uncategorized' });
  for (const { data } of names)
    if (data) byId.set(data.id, { value: data.id, label: data.name });
  for (const category of page?.items ?? [])
    byId.set(category.id, { value: category.id, label: category.name });
  const options = [...byId.values()];

  return { options, setSearch };
}
