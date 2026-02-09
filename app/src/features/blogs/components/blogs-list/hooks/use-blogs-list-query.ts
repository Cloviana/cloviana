import {
  usePathname,
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useCallback, useMemo } from 'react';

export const useBlogsListQuery = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const q = searchParams.get('q') || undefined;

  const queryParams = useMemo(() => ({ q }), [q]);

  const setQueryParams = useCallback(
    (params: Partial<typeof queryParams>) => {
      const urlSearchParams = new URLSearchParams(searchParams?.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
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
    setQueryParams({ q: undefined });
  }, [setQueryParams]);

  const hasActiveFilters = !!q;

  return {
    storeId,
    q,
    queryParams,
    setQueryParams,
    clearFilters,
    hasActiveFilters,
  };
};
