'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Reads/writes a comma separated filter param. The URL is the list's source of
 * truth, so changing a filter also drops the paging params.
 */
export function useUrlListParam(param: string) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawValue = searchParams.get(param) ?? '';
  const values = useMemo(
    () =>
      Array.from(new Set(rawValue.split(',').filter((item) => item.length))),
    [rawValue],
  );

  const setValues = (nextValues: string[]) => {
    const params = new URLSearchParams(window.location.search);

    if (nextValues.length) {
      params.set(param, nextValues.join(','));
    } else {
      params.delete(param);
    }
    params.delete('page');

    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `${pathname}?${query}` : pathname,
    );
  };

  return [values, setValues] as const;
}
