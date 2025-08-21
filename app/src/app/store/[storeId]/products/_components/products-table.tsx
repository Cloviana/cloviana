'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo } from 'react';

import BasicCellRenderer from '@/components/table/basic-cell-renderer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/table/data-table/data-table';
import { Product } from '@/types/api';

import ProductImage from './product-image';

export function ProductsTable({ products }: { products: Product[] }) {
  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ProductImage url={row?.original?.imageUrl} alt="product-image" />
            <div className="min-w-0 flex-1 font-medium">
              <p className="truncate text-xs">{row.original.title}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <BasicCellRenderer
            value={row.original.status}
            emptyText="No status provided"
            type="uppercase"
          />
        ),
      },
      {
        accessorKey: 'handle',
        header: 'Handle',
        cell: ({ row }) => (
          <BasicCellRenderer
            value={row.original.handle}
            emptyText="No handle provided"
          />
        ),
      },
      {
        accessorKey: 'syncedAt',
        header: 'Sync',
        cell: ({ row }) => (
          <BasicCellRenderer
            value={row.original.syncedAt!}
            emptyText="No sync date provided"
            type="datestring"
          />
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const { onlineStoreUrl, onlineStorePreviewUrl } = row.original;
            const targetUrl = onlineStoreUrl || onlineStorePreviewUrl || null;

            return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                onClick={() => {
                  if (targetUrl) {
                    window.open(targetUrl, '_blank');
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="text-center text-xs text-foreground-light"
            >
              No products present.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
