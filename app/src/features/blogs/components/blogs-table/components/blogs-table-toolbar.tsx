'use client';

import debounce from 'lodash.debounce';
import { ChevronsUpDown, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import type { BlogStatus } from '@/types/api';

import { useBlogsTableQuery } from '../hooks/use-blogs-table-query';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All blogs' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const;

const SEARCH_DEBOUNCE_MS = 350;

export const BlogsTableToolbar = () => {
  const { search, status, setQueryParams } = useBlogsTableQuery();

  const [inputValue, setInputValue] = useState(search || '');

  useEffect(() => {
    setInputValue(search || '');
  }, [search]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setQueryParams({ search: term || undefined, page: 1 });
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
    setQueryParams({ search: undefined, page: 1 });
  };

  const handleStatusChange = (val: string) => {
    const nextStatus = val === 'ALL' ? undefined : (val as BlogStatus);
    setQueryParams({ status: nextStatus, page: 1 });
  };

  const currentStatus = status || 'ALL';
  const currentStatusLabel = STATUS_OPTIONS.find(
    (o) => o.value === currentStatus,
  )?.label;

  return (
    <div className="flex w-full flex-col gap-2 md:flex-row">
      <div className="flex-1">
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

      <div className="block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="w-full min-w-[160px] justify-between md:w-auto"
            >
              {currentStatusLabel}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuRadioGroup
              value={currentStatus}
              onValueChange={handleStatusChange}
              className="space-y-1"
            >
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
