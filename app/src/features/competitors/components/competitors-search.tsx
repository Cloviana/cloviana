'use client';

import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

const SEARCH_DEBOUNCE_MS = 250;

export function CompetitorsSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('q') ?? '';
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);

  const updateSearchParams = useMemo(
    () =>
      debounce((value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
          params.set('q', value);
        } else {
          params.delete('q');
        }

        const queryString = params.toString();
        window.history.replaceState(
          null,
          '',
          queryString ? `${pathname}?${queryString}` : pathname,
        );
      }, SEARCH_DEBOUNCE_MS),
    [pathname, searchParams],
  );

  useEffect(() => updateSearchParams.cancel, [updateSearchParams]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  function handleSearch(value: string) {
    setSearchQuery(value);
    updateSearchParams(value);
  }

  return (
    <InputGroup size="default" className="w-72">
      <InputGroupAddon size="default">
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        type="text"
        aria-label="Search competitors"
        placeholder="Search competitors..."
        value={searchQuery}
        onChange={(event) => handleSearch(event.target.value)}
      />
    </InputGroup>
  );
}
