import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  size?: React.ComponentProps<typeof Button>['size'];
  className?: string;
} & (
  | (React.ComponentProps<'button'> & { href?: never })
  | (React.ComponentProps<'a'> & { href: string; disabled?: never })
);

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) {
  const activeClassName =
    isActive &&
    'bg-background-selected text-text-selected hover:bg-background-selected-hovered active:bg-background-selected-pressed enabled:hover:bg-background-selected-hovered enabled:active:bg-background-selected-pressed';

  if (props.href !== undefined) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={cn(
          !isActive &&
            'hover:bg-background-neutral-subtle-hovered active:bg-background-neutral-subtle-pressed',
          activeClassName,
          className,
        )}
        nativeButton={false}
        render={
          <a
            aria-current={isActive ? 'page' : undefined}
            data-active={isActive}
            {...props}
          />
        }
      />
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive}
      className={cn(activeClassName, className)}
      {...props}
    />
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
      className={className}
      {...props}
    >
      <ChevronLeftIcon data-icon="inline-start" className="cn-rtl-flip" />
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
      className={className}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end" className="cn-rtl-flip" />
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
        "text-icon-subtle flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon />
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
