// features/products/products-table.tsx
'use client';

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Product } from '@/types/api';

import { productColumns } from './columns';

export function DataTable({ products }: { products: Product[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo<ColumnDef<Product>[]>(() => productColumns, []);
  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="overflow-hidden border-b">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => {
                const canSort = h.column.getCanSort();
                const sortDir = h.column.getIsSorted();
                return (
                  <TableHead
                    key={h.id}
                    onClick={
                      canSort ? h.column.getToggleSortingHandler() : undefined
                    }
                    className={[
                      canSort ? 'cursor-pointer select-none' : '',
                      h.column.columnDef.meta?.align === 'right'
                        ? 'text-right'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="flex items-center gap-1">
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                      {sortDir === 'asc' && <span>↑</span>}
                      {sortDir === 'desc' && <span>↓</span>}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((r) => {
              const { onlineStoreUrl, onlineStorePreviewUrl } = r.original;
              const targetUrl = onlineStoreUrl || onlineStorePreviewUrl || null;
              return (
                <TableRow
                  key={r.id}
                  data-state={r.getIsSelected() && 'selected'}
                  className={targetUrl ? 'cursor-pointer' : undefined}
                  onClick={() => {
                    if (targetUrl) window.open(targetUrl, '_blank');
                  }}
                >
                  {r.getVisibleCells().map((c) => (
                    <TableCell
                      key={c.id}
                      className={
                        c.column.columnDef.meta?.align === 'right'
                          ? 'text-right'
                          : undefined
                      }
                    >
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-xs text-foreground-light"
              >
                No products present.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
