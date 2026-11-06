'use client';

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { categoryPagesQueryOptions, categoryQueryOptions } from '../../queries';
import type { Category } from '../../types';

const MIN_SEARCH = 2;
const MAX_SEARCH = 100;

type Options = {
  slug: string;
  value: string | null;
  onChange: (id: string | null) => void;
  onBlur?: () => void;
  /** Also offer inactive and internal categories (a dashboard form can pick one as a parent). */
  includeHidden?: boolean;
};

export type CategoryPickerStatus = {
  message: string;
  loading?: boolean;
  retry?: () => Promise<unknown>;
};

export function useCategoryPicker({
  slug,
  value,
  onChange,
  onBlur,
  includeHidden = false,
}: Options) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Query options lowercase the term; trimming here is enough.
  const term = search.trim();
  const isSearching = term.length > 0;
  const isValidSearch = term.length >= MIN_SEARCH && term.length <= MAX_SEARCH;
  const isDebouncing = isSearching && term !== debouncedSearch;
  const searchReady = !isSearching || (isValidSearch && !isDebouncing);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(term), 300);
    return () => clearTimeout(timeout);
  }, [term]);

  const selected = useQuery({
    ...categoryQueryOptions(slug, value ?? '', { includeHidden }),
    enabled: Boolean(value),
  });
  const current = useQuery({
    ...categoryQueryOptions(slug, currentId ?? '', { includeHidden }),
    enabled: open && !isSearching && Boolean(currentId),
  });
  const list = useInfiniteQuery({
    ...categoryPagesQueryOptions(
      slug,
      isSearching
        ? { search: debouncedSearch, includeHidden }
        : { parentId: currentId ?? undefined, includeHidden },
    ),
    enabled: open && searchReady,
  });

  const children = searchReady
    ? (list.data?.pages.flatMap((page) => page.items) ?? [])
    : [];
  const canBrowse = (category: Category) =>
    !isSearching && category.hasChildren && category.id !== currentId;

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSearch('');
      setCurrentId(selected.data?.id ?? null);
    } else {
      onBlur?.();
    }
  }

  /** Returns true when the category was selected, false when it was browsed into. */
  function choose(category: Category) {
    // Seeds the trigger label so the selected name shows without a refetch.
    queryClient.setQueryData(
      categoryQueryOptions(slug, category.id, { includeHidden }).queryKey,
      category,
    );
    setSearch('');

    if (canBrowse(category)) {
      setCurrentId(category.id);
      return false;
    }
    onChange(category.id);
    return true;
  }

  function goBack() {
    setCurrentId(current.data?.parentId ?? null);
    setSearch('');
  }

  let retry: CategoryPickerStatus['retry'];
  if (list.isError && !list.data) retry = list.refetch;
  else if (!isSearching && current.isError) retry = current.refetch;
  else if (selected.isError) retry = selected.refetch;
  else if (list.isFetchNextPageError) retry = list.fetchNextPage;

  let status: CategoryPickerStatus | null = null;
  let emptyMessage: string | null = null;
  if (isSearching && !isValidSearch) {
    status = { message: `Type at least ${MIN_SEARCH} characters to search.` };
  } else if (isDebouncing || list.isLoading || list.isFetchingNextPage) {
    status = { message: 'Loading categories…', loading: true };
  } else if (retry) {
    status = { message: 'Could not load categories.', retry };
  } else if (children.length === 0 && (isSearching || !currentId)) {
    emptyMessage = isSearching ? 'No results' : 'No categories available';
  }

  return {
    open,
    search,
    setSearch,
    changeOpen,
    items:
      !isSearching && current.data ? [current.data, ...children] : children,
    selected: selected.data ?? null,
    current: current.data,
    isSearching,
    canBrowse,
    choose,
    status,
    emptyMessage,
    isBusy: list.isFetching || Boolean(status?.loading),
    more:
      searchReady && list.hasNextPage && !list.isFetchNextPageError
        ? { loading: list.isFetchingNextPage, load: list.fetchNextPage }
        : null,
    back:
      !isSearching && currentId !== null
        ? {
            label: current.data?.path.at(-2)?.name ?? 'All',
            disabled: current.isLoading,
            go: goBack,
          }
        : null,
  };
}
