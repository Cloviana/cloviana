'use client';

import { ChevronRightIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Each level indents by this many spacing units (28px): a toggle button and its gap,
// so a child's toggle sits under its parent's name.
const INDENT = 7;
const indent = (depth: number) => ({
  paddingInlineStart: `calc(var(--spacing) * ${depth * INDENT})`,
});

type LevelContext = {
  depth: number;
  /** Whether names leave room for a toggle, so rows with and without one line up. */
  reserveToggle: boolean;
};

const TreeTableLevelContext = React.createContext<LevelContext>({
  depth: -1,
  reserveToggle: false,
});

function useLevel() {
  const level = React.useContext(TreeTableLevelContext);
  return { ...level, depth: Math.max(level.depth, 0) };
}

/** A table whose rows can nest. It keeps its columns at the widths of its header, so expanding a row moves nothing. */
function TreeTable({
  className,
  ...props
}: React.ComponentProps<typeof Table>) {
  return (
    <Table
      data-slot="tree-table"
      role="treegrid"
      className={cn('table-fixed', className)}
      {...props}
    />
  );
}

/**
 * One level of rows: the top level, or the children of an expanded row. It nests, so each level is one deeper
 * than the one around it. Set `hasToggles` when some row in this level can expand: names then leave room for the
 * toggle. Levels below the top always leave room, so children sit deeper than their parent's name.
 */
function TreeTableLevel({
  hasToggles = false,
  children,
}: {
  hasToggles?: boolean;
  children: React.ReactNode;
}) {
  const parent = React.useContext(TreeTableLevelContext);
  const depth = parent.depth + 1;
  const value = React.useMemo(
    () => ({ depth, reserveToggle: depth > 0 || hasToggles }),
    [depth, hasToggles],
  );

  return (
    <TreeTableLevelContext.Provider value={value}>
      {children}
    </TreeTableLevelContext.Provider>
  );
}

/** A row of its level. `expanded` says whether it is open; leave it out for a row that cannot expand. */
function TreeTableRow({
  expanded,
  ...props
}: React.ComponentProps<typeof TableRow> & { expanded?: boolean }) {
  const { depth } = useLevel();

  return (
    <TableRow aria-level={depth + 1} aria-expanded={expanded} {...props} />
  );
}

/**
 * The cell holding a row's name: indented for its level, with the toggle when the row can expand.
 * The content wraps instead of truncating.
 */
function TreeTableNameCell({
  expandable = false,
  expanded = false,
  onToggle,
  label,
  children,
  ...props
}: React.ComponentProps<typeof TableCell> & {
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  /** The row's name, for the toggle's accessible label ("Expand {label} row"). */
  label?: string;
}) {
  const { depth, reserveToggle } = useLevel();

  return (
    <TableCell {...props}>
      <div style={indent(depth)} className="flex min-h-6 items-center gap-1">
        {reserveToggle &&
          (expandable ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`${expanded ? 'Collapse' : 'Expand'}${label ? ` ${label}` : ''} row`}
              onClick={onToggle}
            >
              <ChevronRightIcon
                aria-hidden="true"
                className={cn('transition-transform', expanded && 'rotate-90')}
              />
            </Button>
          ) : (
            <span aria-hidden="true" className="size-6 shrink-0" />
          ))}
        <div className="min-w-0 whitespace-normal">{children}</div>
      </div>
    </TableCell>
  );
}

/** Placeholder rows for a level that is loading. `children` are the placeholder cells after the name's. */
function TreeTableLoadingRows({
  count = 2,
  label,
  children,
}: {
  count?: number;
  label?: string;
  children?: React.ReactNode;
}) {
  const { depth, reserveToggle } = useLevel();

  return Array.from({ length: count }, (_, index) => (
    <TableRow key={index} className="hover:bg-transparent">
      <TableCell>
        <div style={indent(depth)} className="flex min-h-6 items-center gap-1">
          {reserveToggle && (
            <span aria-hidden="true" className="size-6 shrink-0" />
          )}
          <Skeleton className="h-4 w-40" />
          {label && index === 0 && (
            <span role="status" className="sr-only">
              {label}
            </span>
          )}
        </div>
      </TableCell>
      {children}
    </TableRow>
  ));
}

/** A row across all columns, indented to its level. For an error, an empty message or a "load more" button. */
function TreeTableMessageRow({
  colSpan,
  className,
  children,
}: {
  colSpan: number;
  className?: string;
  children: React.ReactNode;
}) {
  const { depth } = useLevel();

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan}>
        <div
          style={indent(depth)}
          className={cn('flex min-h-6 items-center gap-2', className)}
        >
          {children}
        </div>
      </TableCell>
    </TableRow>
  );
}

export {
  TreeTable,
  TreeTableLevel,
  TreeTableLoadingRows,
  TreeTableMessageRow,
  TreeTableNameCell,
  TreeTableRow,
};
