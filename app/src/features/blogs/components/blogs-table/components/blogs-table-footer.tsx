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
import type { Blog, PaginatedResponse } from '@/types/api';
import { cn } from '@/utils/cn';

import { useBlogsTableQuery } from '../hooks/use-blogs-table-query';

const LIMIT_OPTIONS = [25, 50, 100] as const;
type LimitOption = (typeof LIMIT_OPTIONS)[number];

export const BlogsTableFooter = () => {
  const { storeId, page, limit, queryParams, setQueryParams } =
    useBlogsTableQuery();
  const { data, isLoading } = useGetBlogs(storeId, { params: queryParams });

  const typed = data as PaginatedResponse<Blog> | undefined;

  const { start, end, total, totalPages } = useMemo(() => {
    const rawTotal = typed?.meta?.total;
    const rawTotalPages = typed?.meta?.totalPages;
    const safeTotal = Math.max(rawTotal ?? 1, 1);
    const safeTotalPages = Math.max(rawTotalPages ?? 1, 1);

    if (!typed?.meta) {
      return { start: 1, end: 1, total: 1, totalPages: 1 };
    }

    const startValue = Math.min((page - 1) * limit + 1, safeTotal);
    const endValue = Math.min(page * limit, safeTotal);

    return {
      start: startValue,
      end: endValue,
      total: safeTotal,
      totalPages: safeTotalPages,
    };
  }, [typed?.meta, page, limit]);

  const onLimitChange = (value: string) => {
    const nextLimit = Number(value);
    if (!Number.isFinite(nextLimit) || nextLimit === limit) return;
    if (!LIMIT_OPTIONS.includes(nextLimit as LimitOption)) return;

    setQueryParams({ limit: nextLimit, page: 1 });
  };

  const goToPage = (nextPage: number) => {
    const bounded = Math.min(Math.max(nextPage, 1), totalPages);
    if (bounded === page) return;

    setQueryParams({ page: bounded });
  };

  const canPrev = page > 1;
  const canNext = page < totalPages;

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
        <div className={cn('flex items-center gap-2', total === 1 && 'hidden')}>
          <Button
            variant="outline"
            size="icon"
            disabled={!canPrev || isLoading}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={!canNext || isLoading}
            onClick={() => goToPage(page + 1)}
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
