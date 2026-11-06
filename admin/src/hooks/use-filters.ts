'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import {
  type FilterDefinition,
  PAGE_PARAM,
  SEARCH_PARAM,
  readFilterState,
} from '@/lib/filters';

// Changes go through the History API, which Next syncs into useSearchParams without re-running the server page.
function updateParams(change: (params: URLSearchParams) => void) {
  const params = new URLSearchParams(window.location.search);
  change(params);
  const search = params.toString();
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${search ? `?${search}` : ''}`,
  );
}

/**
 * Search text, filter selections and the page number, kept in the URL so they survive reloads and navigation
 * and are shared by every component that calls this hook. Changing the search or a filter returns to page 1.
 * `definitions` must be a stable reference.
 */
export function useFilters(definitions: FilterDefinition[]) {
  const searchParams = useSearchParams();
  const { query, page, values } = useMemo(
    () => readFilterState(definitions, searchParams),
    [definitions, searchParams],
  );

  const setValues = useCallback(
    (id: string, next: string[]) =>
      updateParams((params) => {
        params.delete(id);
        params.delete(PAGE_PARAM);
        for (const value of next) params.append(id, value);
      }),
    [],
  );

  const setQuery = useCallback(
    (next: string) =>
      updateParams((params) => {
        params.delete(PAGE_PARAM);
        if (next) params.set(SEARCH_PARAM, next);
        else params.delete(SEARCH_PARAM);
      }),
    [],
  );

  const setPage = useCallback(
    (next: number) =>
      updateParams((params) => {
        if (next > 1) params.set(PAGE_PARAM, String(next));
        else params.delete(PAGE_PARAM);
      }),
    [],
  );

  const clear = useCallback(
    () =>
      updateParams((params) => {
        params.delete(SEARCH_PARAM);
        params.delete(PAGE_PARAM);
        for (const { id } of definitions) params.delete(id);
      }),
    [definitions],
  );

  return {
    values,
    query,
    page,
    isFiltered: query !== '' || Object.keys(values).length > 0,
    setValues,
    setQuery,
    setPage,
    clear,
  };
}
