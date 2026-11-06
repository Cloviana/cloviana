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

import { useProducts } from '../../hooks/use-products';
import { PRODUCTS_PAGE_SIZE, productFilters } from '../../lib/product-filters';
import { productStatuses } from '../../lib/product-statuses';

import { ProductThumbnail } from './product-thumbnail';
import { ProductsEmptyState } from './products-empty-state';
import { ProductsNoResults } from './products-no-results';
import { ProductsPagination } from './products-pagination';
import { ProductsSelectionBar } from './products-selection-bar';
import { ProductsTableColumns } from './products-table-columns';
import { ProductsTableSkeleton } from './products-table-skeleton';

const relativeTime = new Intl.RelativeTimeFormat('en-GB', {
  numeric: 'always',
});
const timeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

function updatedLabel(value: string, now: number) {
  const elapsed = Math.max(0, (now - new Date(value).getTime()) / 1000);
  for (const [unit, seconds] of timeUnits) {
    if (elapsed >= seconds)
      return relativeTime.format(-Math.floor(elapsed / seconds), unit);
  }
  return 'Just now';
}

export function ProductsTable({ slug, now }: { slug: string; now: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isPending, isPlaceholderData, refetch } = useProducts(slug);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const { page, isFiltered, clear, setPage } = useFilters(productFilters);

  useEffect(() => {
    const parser = new DOMParser();
    setDescriptions(
      Object.fromEntries(
        (data?.items ?? []).map((product) => [
          product.id,
          parser
            .parseFromString(product.description ?? '', 'text/html')
            .body.textContent?.trim() ?? '',
        ]),
      ),
    );
  }, [data]);

  // Changing the search, a filter or the page clears the selection, so a bulk action never reaches rows that are hidden.
  const filtersKey = searchParams.toString();
  useEffect(() => {
    setSelectedIds((previous) => (previous.size ? new Set() : previous));
  }, [filtersKey]);

  // A link to a page past the end (after products were deleted) moves to the last page.
  const matching = data?.total;
  useEffect(() => {
    if (matching === undefined || isPlaceholderData) return;
    const lastPage = Math.max(1, Math.ceil(matching / PRODUCTS_PAGE_SIZE));
    if (page > lastPage) setPage(lastPage);
  }, [matching, isPlaceholderData, page, setPage]);

  // The skeleton also covers the moment between loading a page past the end and moving to the last page.
  if (isPending || (data && data.total > 0 && data.items.length === 0))
    return <ProductsTableSkeleton />;

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p role="alert" className="text-text-subtlest text-body">
          Could not load products.
        </p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { items: rows, total } = data;
  const selectedCount = rows.filter((product) =>
    selectedIds.has(product.id),
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
          <ProductsNoResults onClear={clear} />
        ) : (
          <ProductsEmptyState />
        )
      ) : (
        // Fixed columns; below this width the table scrolls sideways instead of letting cells overlap.
        <Table aria-label="Products" className="min-w-3xl table-fixed">
          <ProductsTableColumns />
          <TableHeader>
            <TableRow>
              <TableHead
                scope="col"
                className="px-3 [&:has([role=checkbox])]:pr-3"
              >
                <Checkbox
                  aria-label="Select all products"
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  onCheckedChange={(checked) =>
                    setSelectedIds(
                      checked
                        ? new Set(rows.map((product) => product.id))
                        : new Set(),
                    )
                  }
                />
              </TableHead>
              <TableHead scope="col">Product</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col">Category</TableHead>
              <TableHead scope="col">Offers</TableHead>
              <TableHead scope="col">Last updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((product) => {
              const status = productStatuses[product.status];
              const href = paths.mp.products.edit.getHref(
                slug,
                product.id,
                new URLSearchParams(searchParams.toString()),
              );
              return (
                <TableRow
                  key={product.id}
                  data-state={
                    selectedIds.has(product.id) ? 'selected' : undefined
                  }
                  className="cursor-pointer"
                  // A mouse shortcut for the title link, which stays for keyboards, screen readers and "open in new tab".
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
                      aria-label={`Select ${product.title}`}
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={(checked) =>
                        setSelectedIds((previous) => {
                          const next = new Set(previous);
                          if (checked) next.add(product.id);
                          else next.delete(product.id);
                          return next;
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ProductThumbnail src={product.thumbnail} />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <Anchor
                          href={href}
                          variant="hover"
                          className="max-w-72 truncate font-medium"
                          title={product.title}
                        >
                          {product.title}
                        </Anchor>
                        {descriptions[product.id] && (
                          <p className="text-body-small text-text-subtlest truncate">
                            {descriptions[product.id]}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {product.category?.name ?? 'Uncategorized'}
                  </TableCell>
                  <TableCell>
                    {product.offerCount === 0
                      ? 'No offers'
                      : `${product.offerCount} ${product.offerCount === 1 ? 'offer' : 'offers'}`}
                  </TableCell>
                  <TableCell>
                    <time
                      dateTime={product.updatedAt}
                      title={new Date(product.updatedAt).toUTCString()}
                    >
                      {updatedLabel(product.updatedAt, now)}
                    </time>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {total > PRODUCTS_PAGE_SIZE && (
        <ProductsPagination
          page={page}
          pageSize={PRODUCTS_PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      )}
      <ProductsSelectionBar
        slug={slug}
        products={rows.filter((product) => selectedIds.has(product.id))}
        open={selectedCount > 0}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
