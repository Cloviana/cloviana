'use client';

import debounce from 'lodash.debounce';
import { ChevronDown, Search, Table2 } from 'lucide-react';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

import { TagsFilterButton, TopicsFilterButton } from '../filter-buttons';

const SEARCH_DEBOUNCE_MS = 250;

const statusOptions = [
  { value: 'all', label: 'All Prompts' },
  { value: 'active', label: 'Active Prompts' },
  { value: 'inactive', label: 'Inactive Prompts' },
] as const;

type PromptStatusFilter = (typeof statusOptions)[number]['value'];

const isPromptStatusFilter = (
  value: string | null,
): value is PromptStatusFilter =>
  statusOptions.some((option) => option.value === value);

export function PromptsFilterRow() {
  const { businessId } = useParams<{ businessId: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const urlStatus = isPromptStatusFilter(statusParam) ? statusParam : 'all';
  const urlSearchQuery = searchParams.get('q') ?? '';
  const [status, setStatus] = useState<PromptStatusFilter>(urlStatus);
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const selectedStatus =
    statusOptions.find((option) => option.value === status) ?? statusOptions[0];

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

        const query = params.toString();
        window.history.replaceState(
          null,
          '',
          query ? `${pathname}?${query}` : pathname,
        );
      }, SEARCH_DEBOUNCE_MS),
    [pathname],
  );

  useEffect(() => updateSearchParams.cancel, [updateSearchParams]);

  useEffect(() => {
    setStatus(urlStatus);
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery, urlStatus]);

  const handleStatusChange = (value: PromptStatusFilter) => {
    const params = new URLSearchParams(window.location.search);

    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    params.delete('page');

    setStatus(value);

    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `${pathname}?${query}` : pathname,
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateSearchParams(value);
  };

  return (
    <div className="bg-surface flex shrink-0 items-center justify-between px-3 py-2.5">
      <div className="-ml-1 flex min-w-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Table2 />
              {selectedStatus.label}
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {statusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                data-active={status === option.value}
                onSelect={() => handleStatusChange(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <InputGroup size="sm" className="w-64">
          <InputGroupAddon size="sm">
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            aria-label="Filter prompts by text"
            placeholder="Filter prompts..."
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </InputGroup>
      </div>

      <div className="flex items-center gap-1">
        <TopicsFilterButton businessId={businessId} />
        <TagsFilterButton businessId={businessId} />
      </div>
    </div>
  );
}
