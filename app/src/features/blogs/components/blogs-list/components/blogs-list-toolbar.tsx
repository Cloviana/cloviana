'use client';

import debounce from 'lodash.debounce';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useBlogsListQuery } from '@/features/blogs/components/blogs-list/hooks/use-blogs-list-query';

const SEARCH_DEBOUNCE_MS = 350;

export const BlogsListToolbar = () => {
  const { q, setQueryParams } = useBlogsListQuery();
  const [inputValue, setInputValue] = useState(q || '');

  useEffect(() => {
    setInputValue(q || '');
  }, [q]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setQueryParams({ q: term || undefined });
    }, SEARCH_DEBOUNCE_MS),
    [setQueryParams],
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setInputValue('');
    debouncedSearch.cancel();
    setQueryParams({ q: undefined });
  };

  return (
    <div className="flex w-full items-center">
      <div className="w-full">
        <InputGroup>
          <InputGroupInput
            placeholder="Search by topic"
            value={inputValue}
            size="default"
            onChange={handleSearchChange}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          {inputValue && (
            <InputGroupAddon align="inline-end">
              <button
                onClick={handleClearSearch}
                className="text-foreground-lighter p-1.5 transition-opacity hover:opacity-90"
              >
                <X className="size-4.5" strokeWidth={2.5} />
              </button>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>
    </div>
  );
};
