'use client';

import debounce from 'lodash.debounce';
import { ListFilter, Search } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { PageHeaderRow } from '@/features/dashboard/components/page-header';

const SEARCH_DEBOUNCE_MS = 250;

function replaceSearchParams(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  window.history.replaceState(
    null,
    '',
    query ? `${pathname}?${query}` : pathname,
  );
}

type WorkflowsFilterRowProps = {
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
};

export function WorkflowsFilterRow({
  filtersOpen,
  onFiltersOpenChange,
}: WorkflowsFilterRowProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get('q') ?? '';
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);

  const updateSearchParams = useMemo(
    () =>
      debounce((value: string) => {
        const params = new URLSearchParams(window.location.search);

        if (value) {
          params.set('q', value);
        } else {
          params.delete('q');
        }

        params.delete('page');
        replaceSearchParams(pathname, params);
      }, SEARCH_DEBOUNCE_MS),
    [pathname],
  );

  useEffect(() => updateSearchParams.cancel, [updateSearchParams]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  return (
    <PageHeaderRow className="bg-surface min-h-12 gap-2 py-2.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={filtersOpen}
        onClick={() => onFiltersOpenChange(!filtersOpen)}
      >
        <ListFilter />
        {filtersOpen ? 'Hide filters' : 'Show filters'}
      </Button>

      <InputGroup size="sm" className="w-64 shrink-0">
        <InputGroupAddon size="sm">
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          aria-label="Search workflows"
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={(event) => {
            const value = event.target.value;
            setSearchQuery(value);
            updateSearchParams(value);
          }}
        />
      </InputGroup>
    </PageHeaderRow>
  );
}
