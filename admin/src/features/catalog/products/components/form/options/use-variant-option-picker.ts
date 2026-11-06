'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { attributePagesQueryOptions } from '@/features/catalog/attributes';

const MIN_SEARCH = 2;
const MAX_SEARCH = 100;

type PickerStatus = {
  message: string;
  loading?: boolean;
  retry?: () => Promise<unknown>;
};

export function useVariantOptionPicker(slug: string, disabled: boolean) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const term = search.trim().toLowerCase();
  const isSearching = term.length > 0;
  const isValidSearch = term.length >= MIN_SEARCH && term.length <= MAX_SEARCH;
  const isDebouncing = isSearching && term !== debouncedSearch;
  const searchReady = !isSearching || (isValidSearch && !isDebouncing);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(term), 300);
    return () => clearTimeout(timeout);
  }, [term]);

  const list = useInfiniteQuery({
    ...attributePagesQueryOptions(slug, {
      search: isSearching ? debouncedSearch : undefined,
    }),
    enabled: open && !disabled && Boolean(slug) && searchReady,
  });
  const items = searchReady
    ? (list.data?.pages.flatMap((page) => page.items) ?? [])
    : [];

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setSearch('');
  }

  let status: PickerStatus | null = null;
  let emptyMessage: string | null = null;
  if (isSearching && !isValidSearch) {
    status = { message: `Type at least ${MIN_SEARCH} characters to search.` };
  } else if (list.isError) {
    status = {
      message: 'Could not load saved options.',
      retry: list.isFetchNextPageError ? list.fetchNextPage : list.refetch,
    };
  } else if (isDebouncing || list.isLoading || list.isFetchingNextPage) {
    status = { message: 'Loading saved options…', loading: true };
  } else if (items.length === 0) {
    emptyMessage = isSearching
      ? 'No options found.'
      : 'No saved options available.';
  }

  return {
    open,
    changeOpen,
    search,
    setSearch,
    items,
    status,
    emptyMessage,
    isBusy: list.isFetching || isDebouncing,
    more:
      open && searchReady && list.hasNextPage && !list.isError
        ? { loading: list.isFetching, load: list.fetchNextPage }
        : null,
  };
}
