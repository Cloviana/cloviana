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
import { useParams } from 'next/navigation';
import { FC } from 'react';

import * as Page from '@/components/layout/page';
import BasicCellRenderer from '@/components/table/basic-cell-renderer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/table/data-table/data-table';
import { useGetProducts } from '@/features/products/get-products';
import { Product } from '@/types/api';

import ProductImage from './_components/product-image';

const ProductsPage: FC = () => {
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <ProductImage
            url={row?.original?.mainImageUrl}
            alt={row?.original?.mainImageAlt}
          />
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
      accessorKey: 'updatedAt',
      header: 'Sync',
      cell: ({ row }) => (
        <BasicCellRenderer
          value={row.original.updatedAt}
          emptyText="No sync date provided"
          type="datestring"
        />
      ),
    },
  ];

  const { storeId } = useParams<{ storeId: string }>();

  const { data: products = [] } = useGetProducts(storeId);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  if (!storeId) return null;

  return (
    <Page.Root>
      <Page.Header className="flex items-center justify-between gap-2">
        <Page.Title>Products</Page.Title>
        <Page.Button
          icon="sync"
          allowIconColor={false}
          iconClassName="text-foreground-light"
        >
          Sync
        </Page.Button>
      </Page.Header>

      <Page.Content className="overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
      </Page.Content>
    </Page.Root>
  );
};

export default ProductsPage;
