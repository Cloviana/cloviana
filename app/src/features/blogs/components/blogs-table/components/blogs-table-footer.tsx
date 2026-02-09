'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetBlogs } from '@/features/blogs/api/get-blogs';
import { cn } from '@/utils/cn';

import { useBlogsTableQuery } from '../hooks/use-blogs-table-query';

const LIMIT_OPTIONS = [25, 50, 100] as const;
type LimitOption = (typeof LIMIT_OPTIONS)[number];

export const BlogsTableFooter = () => {
  const { storeId, limit, search, status, setQueryParams } =
    useBlogsTableQuery();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetBlogs({
      storeId,
      params: {
        limit,
        q: search,
        status,
      },
    });

  const { start, end, total } = useMemo(() => {
    const loaded = data?.pages.reduce((acc, page) => acc + page.data.length, 0);
    const safeTotal = Math.max(loaded ?? 0, 0);

    if (!loaded) {
      return { start: 0, end: 0, total: 0 };
    }

    return {
      start: 1,
      end: safeTotal,
      total: safeTotal,
    };
  }, [data?.pages]);

  const onLimitChange = (value: string) => {
    const nextLimit = Number(value);
    if (!Number.isFinite(nextLimit) || nextLimit === limit) return;
    if (!LIMIT_OPTIONS.includes(nextLimit as LimitOption)) return;

    setQueryParams({ limit: nextLimit, page: 1 });
  };

  const selectedLimit = LIMIT_OPTIONS.includes(limit as LimitOption)
    ? String(limit)
    : String(LIMIT_OPTIONS[0]);

  return (
    <div className="flex items-center justify-between">
      <div className="text-foreground-light text-sm">
        <span className="font-bold">
          {start}–{end}
        </span>{' '}
        of {total}
      </div>
      <div className="flex items-center gap-2">
        <div className={cn('flex items-center gap-2', total === 0 && 'hidden')}>
          <Button variant="outline" size="icon" disabled>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={!hasNextPage || isLoading || isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className={isLoading ? 'pointer-events-none opacity-60' : ''}>
          <Select value={selectedLimit} onValueChange={onLimitChange}>
            <SelectTrigger className="w-[170px] justify-between">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {LIMIT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
