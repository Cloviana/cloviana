'use client';

import { SearchIcon, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useFilters } from '@/hooks/use-filters';

import { storeFilters } from '../../lib/store-filters';

export function StoresSearch() {
  const { query, setQuery } = useFilters(storeFilters);
  const [search, setSearch] = useState(query);
  const debounced = useDebouncedValue(search, 200);
  // The last value that went to or came from the URL, so the two effects below don't undo each other.
  const synced = useRef(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounced === synced.current) return;
    synced.current = debounced;
    setQuery(debounced);
  }, [debounced, setQuery]);

  // Pulls changes made elsewhere (such as "Clear all") back into the input.
  useEffect(() => {
    if (query === synced.current) return;
    synced.current = query;
    setSearch(query);
  }, [query]);

  return (
    <InputGroup className="w-96 max-w-full">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search stores…"
        aria-label="Search stores"
      />
      {search.length > 0 && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => {
              setSearch('');
              inputRef.current?.focus();
            }}
          >
            <XIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
