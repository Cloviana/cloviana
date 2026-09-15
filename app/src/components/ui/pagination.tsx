'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/cn';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex items-center gap-0.5', className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>;

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      className={className}
      asChild
    >
      <a
        aria-current={isActive ? 'page' : undefined}
        data-slot="pagination-link"
        data-active={isActive}
        {...props}
      />
    </Button>
  );
}

function PaginationPrevious({
  className,
  text = 'Previous',
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('pl-1.5!', className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = 'Next',
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn('pr-1.5!', className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">More pages</span>
    </span>
  );
}

type PaginationControlProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  /** Plural noun used in the control labels, e.g. "prompts". */
  itemLabel?: string;
  className?: string;
};

/**
 * Prev / page-picker / next, for lists with more pages than fit as numbers.
 * Controlled and routing-agnostic: where `page` comes from is the caller's
 * business, which is what lets a URL-paged and a cursor-paged list share it.
 */
function PaginationControl({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  itemLabel = 'results',
  className,
}: PaginationControlProps) {
  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;

    onPageChange(nextPage);
  };

  return (
    <Pagination className={cn('mx-0 w-auto justify-start', className)}>
      <PaginationContent className="gap-3">
        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Previous ${itemLabel} page`}
            disabled={disabled || page <= 1}
            onClick={() => changePage(page - 1)}
          >
            <ChevronLeftIcon />
          </Button>
        </PaginationItem>

        <PaginationItem>
          <Select
            value={String(page)}
            onValueChange={(value) => changePage(Number(value))}
          >
            <SelectTrigger
              size="sm"
              className="w-16"
              aria-label={`Current ${itemLabel} page`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (option) => (
                  <SelectItem
                    key={option}
                    value={String(option)}
                    showIndicator={false}
                  >
                    {option}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </PaginationItem>

        <PaginationItem>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Next ${itemLabel} page`}
            disabled={disabled || page >= totalPages}
            onClick={() => changePage(page + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </PaginationItem>

        <PaginationItem className="text-[13px] tabular-nums">
          {page} of {totalPages}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationControl,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
