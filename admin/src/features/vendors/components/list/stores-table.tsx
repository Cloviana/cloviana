'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Anchor } from '@/components/ui/anchor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterSummary } from '@/components/ui/filter-bar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';
import { useFilters } from '@/hooks/use-filters';
import { cn } from '@/lib/utils';

import { useStores } from '../../hooks/use-stores';
import { STORES_PAGE_SIZE, storeFilters } from '../../lib/store-filters';
import { storeStatuses } from '../../lib/store-statuses';

import { StoreRowActions } from './store-row-actions';
import { StoresEmptyState } from './stores-empty-state';
import { StoresNoResults } from './stores-no-results';
import { StoresPagination } from './stores-pagination';
import { StoresSelectionBar } from './stores-selection-bar';
import { StoresTableColumns } from './stores-table-columns';
import { StoresTableSkeleton } from './stores-table-skeleton';

// UTC, so the server and the browser render the same day.
const createdFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function StoresTable({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isPending, isPlaceholderData, refetch } = useStores(slug);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const { page, isFiltered, clear, setPage } = useFilters(storeFilters);

  // Changing the search, a filter or the page clears the selection, so a bulk action never reaches rows that are hidden.
  const filtersKey = searchParams.toString();
  useEffect(() => {
    setSelectedIds((previous) => (previous.size ? new Set() : previous));
  }, [filtersKey]);

  // A link to a page past the end moves to the last page.
  const matching = data?.total;
  useEffect(() => {
    if (matching === undefined || isPlaceholderData) return;
    const lastPage = Math.max(1, Math.ceil(matching / STORES_PAGE_SIZE));
    if (page > lastPage) setPage(lastPage);
  }, [matching, isPlaceholderData, page, setPage]);

  // The skeleton also covers the moment between loading a page past the end and moving to the last page.
  if (isPending || (data && data.total > 0 && data.items.length === 0))
    return <StoresTableSkeleton />;

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p role="alert" className="text-text-subtlest text-body">
          Could not load stores.
        </p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { items: rows, total } = data;
  const selectedCount = rows.filter((store) =>
    selectedIds.has(store.id),
  ).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;

  return (
    // While another page or filter loads, the rows stay on screen, dimmed.
    <div
      aria-busy={isPlaceholderData}
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1',
        isPlaceholderData && 'opacity-(--ds-opacity-loading)',
      )}
    >
      {isFiltered && total > 0 && (
        <FilterSummary
          count={total}
          scope="in this marketplace"
          onClear={clear}
        />
      )}
      {total === 0 ? (
        isFiltered ? (
          <StoresNoResults onClear={clear} />
        ) : (
          <StoresEmptyState />
        )
      ) : (
        // Fixed columns; below this width the table scrolls sideways instead of letting cells overlap.
        <Table aria-label="Stores" className="min-w-3xl table-fixed">
          <StoresTableColumns />
          <TableHeader>
            <TableRow>
              <TableHead
                scope="col"
                className="px-3 [&:has([role=checkbox])]:pr-3"
              >
                <Checkbox
                  aria-label="Select all stores"
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  onCheckedChange={(checked) =>
                    setSelectedIds(
                      checked
                        ? new Set(rows.map((store) => store.id))
                        : new Set(),
                    )
                  }
                />
              </TableHead>
              <TableHead scope="col">Store</TableHead>
              <TableHead scope="col">Email</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col">Featured</TableHead>
              <TableHead scope="col">Created</TableHead>
              <TableHead scope="col">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((store) => {
              const status = storeStatuses[store.status];
              const href = paths.mp.stores.detail.getHref(
                slug,
                store.id,
                new URLSearchParams(searchParams.toString()),
              );
              return (
                <TableRow
                  key={store.id}
                  data-state={
                    selectedIds.has(store.id) ? 'selected' : undefined
                  }
                  className="cursor-pointer"
                  // A mouse shortcut for the name link, which stays for keyboards, screen readers and "open in new tab".
                  onClick={(event) => {
                    if (
                      event.target instanceof Element &&
                      event.target.closest('a, button, [role=checkbox]')
                    )
                      return;
                    if (event.metaKey || event.ctrlKey || event.shiftKey)
                      return;
                    if (window.getSelection()?.toString()) return;
                    router.push(href);
                  }}
                >
                  <TableCell className="px-3 [&:has([role=checkbox])]:pr-3">
                    <Checkbox
                      aria-label={`Select ${store.name}`}
                      checked={selectedIds.has(store.id)}
                      onCheckedChange={(checked) =>
                        setSelectedIds((previous) => {
                          const next = new Set(previous);
                          if (checked) next.add(store.id);
                          else next.delete(store.id);
                          return next;
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col items-start gap-0.5">
                      <Anchor
                        href={href}
                        variant="hover"
                        className="max-w-full truncate font-medium"
                        title={store.name}
                      >
                        {store.name}
                      </Anchor>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate" title={store.email}>
                      {store.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>{store.featured ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <time dateTime={store.createdAt}>
                      {createdFormat.format(new Date(store.createdAt))}
                    </time>
                  </TableCell>
                  <TableCell className="px-1">
                    <StoreRowActions slug={slug} store={store} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {total > STORES_PAGE_SIZE && (
        <StoresPagination
          page={page}
          pageSize={STORES_PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      )}
      <StoresSelectionBar
        slug={slug}
        stores={rows.filter((store) => selectedIds.has(store.id))}
        open={selectedCount > 0}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
