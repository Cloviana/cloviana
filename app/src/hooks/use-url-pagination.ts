'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Binds a list's page to `?page=`. Page 1 drops the param so the first page has
 * one canonical URL. Uses router.push, so paging stays in the back button.
 */
export function useUrlPagination() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const parsedPage = Number(searchParams.get('page'));
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage === 1) {
      params.delete('page');
    } else {
      params.set('page', String(nextPage));
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return { page, setPage };
}
