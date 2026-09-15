'use client';

import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

type TableFrameProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'bordered';
};

const TableFrame = React.forwardRef<HTMLDivElement, TableFrameProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      data-slot="table-frame"
      className={cn(
        variant === 'bordered' && 'overflow-hidden rounded-lg border',
        className,
      )}
      {...props}
    />
  ),
);
TableFrame.displayName = 'TableFrame';

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div
    data-slot="table-container"
    data-scrolled="false"
    className="no-scrollbar group/table-scroll relative w-full overflow-x-auto"
    onScroll={(event) => {
      event.currentTarget.dataset.scrolled = String(
        event.currentTarget.scrollLeft > 0,
      );
    }}
  >
    <table
      ref={ref}
      data-slot="table"
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    data-slot="table-header"
    className={cn('[&_tr]:border-b', className)}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    data-slot="table-body"
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    data-slot="table-footer"
    className={cn(
      'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    data-slot="table-row"
    className={cn(
      'hover:bg-accent-subtle data-[state=selected]:bg-accent border-b transition-colors',
      className,
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    data-slot="table-head"
    className={cn(
      'text-foreground h-10 px-4 text-left align-middle text-xs font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    data-slot="table-cell"
    className={cn(
      'px-4 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
      className,
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    data-slot="table-caption"
    className={cn('text-muted-foreground mt-4 text-sm', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

/** Column label that explains itself on hover. Plain text when no tooltip. */
function TableColumnHeading({
  label,
  tooltip,
}: {
  label: string;
  tooltip?: string;
}) {
  if (!tooltip) return <span>{label}</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="decoration-muted-foreground/70 focus-visible:ring-ring rounded-sm underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2"
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-64">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

/** Placeholder for a cell with nothing to show. */
function TableEmptyValue({ children = '-' }: { children?: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

/**
 * `offset` must be a literal Tailwind spacing key (0 or 12) so the class
 * survives Tailwind's static content scan — don't interpolate arbitrary offsets.
 */
type StickyOffset = 0 | 12;

function stickyClassName({
  offset = 0,
  head = false,
  shadow = true,
  interactive = false,
}: {
  offset?: StickyOffset;
  head?: boolean;
  shadow?: boolean;
  interactive?: boolean;
}) {
  return cn(
    'bg-surface sticky',
    offset === 12 ? 'left-12' : 'left-0',
    head ? 'z-20' : 'z-10',
    shadow &&
      'shadow-[inset_-1px_0_0_transparent] transition-shadow group-data-[scrolled=true]/table-scroll:shadow-[inset_-1px_0_0_var(--border)]',
    interactive && 'group-hover:bg-accent-subtle transition-colors',
  );
}

type StickyTableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  offset?: StickyOffset;
  shadow?: boolean;
  interactive?: boolean;
};

/** A left-pinned `TableCell`, for the frozen column in a scrollable table. */
const StickyTableCell = React.forwardRef<
  HTMLTableCellElement,
  StickyTableCellProps
>(({ offset, shadow, interactive, className, ...props }, ref) => (
  <TableCell
    ref={ref}
    className={cn(stickyClassName({ offset, shadow, interactive }), className)}
    {...props}
  />
));
StickyTableCell.displayName = 'StickyTableCell';

type StickyTableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  offset?: StickyOffset;
  shadow?: boolean;
  interactive?: boolean;
};

/** A left-pinned `TableHead`, for the frozen column's header cell. */
const StickyTableHead = React.forwardRef<
  HTMLTableCellElement,
  StickyTableHeadProps
>(({ offset, shadow, interactive, className, ...props }, ref) => (
  <TableHead
    ref={ref}
    className={cn(
      stickyClassName({ offset, shadow, interactive, head: true }),
      className,
    )}
    {...props}
  />
));
StickyTableHead.displayName = 'StickyTableHead';

export {
  TableFrame,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableColumnHeading,
  TableEmptyValue,
  StickyTableCell,
  StickyTableHead,
};
