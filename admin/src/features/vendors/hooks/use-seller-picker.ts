'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { sellerPagesQueryOptions } from '../api/sellers-query-options';

type PickerStatus = {
  message: string;
  loading?: boolean;
  retry?: () => Promise<unknown>;
};

export function useSellerPicker(slug: string, disabled: boolean) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const term = search.trim().toLowerCase();
  const isSearching = term.length > 0;
  const isValidSearch = term.length >= 2 && term.length <= 100;
  const isDebouncing = isSearching && term !== debouncedSearch;
  const searchReady = !isSearching || (isValidSearch && !isDebouncing);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(term), 300);
    return () => clearTimeout(timeout);
  }, [term]);

  const list = useInfiniteQuery({
    ...sellerPagesQueryOptions(slug, {
      search: isSearching ? debouncedSearch : undefined,
    }),
    enabled: open && !disabled && Boolean(slug) && searchReady,
  });

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setSearch('');
  }

  const items = searchReady
    ? (list.data?.pages.flatMap((page) => page.items) ?? [])
    : [];
  let status: PickerStatus | null = null;
  let emptyMessage: string | null = null;

  if (isSearching && !isValidSearch) {
    status = { message: 'Type at least 2 characters to search.' };
  } else if (list.isError) {
    status = {
      message: 'Could not load stores.',
      retry: list.isFetchNextPageError ? list.fetchNextPage : list.refetch,
    };
  } else if (isDebouncing || list.isLoading || list.isFetchingNextPage) {
    status = { message: 'Loading stores…', loading: true };
  } else if (items.length === 0) {
    emptyMessage = isSearching
      ? 'No stores found.'
      : 'No active stores available.';
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
