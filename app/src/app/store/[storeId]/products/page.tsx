'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import React, { FC } from 'react';

import * as Page from '@/components/layout/page';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/table/data-table/data-table';

interface IProducts {
  id: string;
  name: string;
  image: string;
  status: string;
  handle: string;
  lastUpdated: string;
}
const products: IProducts[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?fit=crop&crop=center',
    status: 'Active',
    handle: 'wireless-bluetooth-headphones',
    lastUpdated: 'Mar 14',
  },
  {
    id: '2',
    name: 'Smart Watch Series 5',
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?fit=crop&crop=center',
    status: 'Active',
    handle: 'smart-watch-series-5',
    lastUpdated: 'Mar 14',
  },
  {
    id: '3',
    name: 'Laptop Stand Adjustable',
    image:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?fit=crop&crop=center',
    status: 'Draft',
    handle: 'laptop-stand-adjustable',
    lastUpdated: 'Mar 14',
  },
  {
    id: '4',
    name: 'USB-C Hub Multi-Port',
    image:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?fit=crop&crop=center',
    status: 'Active',
    handle: 'usb-c-hub-multi-port',
    lastUpdated: 'Mar 14',
  },
  {
    id: '5',
    name: 'Wireless Charging Pad',
    image:
      'https://images.unsplash.com/photo-1586953208448-b95a79798f07?fit=crop&crop=center',
    status: 'Inactive',
    handle: 'wireless-charging-pad',
    lastUpdated: 'Mar 14',
  },
  {
    id: '6',
    name: 'Mechanical Keyboard RGB',
    image:
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?fit=crop&crop=center',
    status: 'Active',
    handle: 'mechanical-keyboard-rgb',
    lastUpdated: 'Mar 14',
  },
];

const columns: ColumnDef<IProducts>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="size-8 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <img
            src={row.original.image}
            alt={row.original.name}
            className="size-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 font-medium">
          <p className="truncate text-xs">{row.original.name}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span className="text-xs font-normal text-foreground-light">
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: 'handle',
    header: 'Handle',
    cell: ({ row }) => (
      <span className="text-xs font-normal text-foreground-light">
        {row.original.handle}
      </span>
    ),
  },
  {
    accessorKey: 'lastUpdated',
    header: 'Sync',
    cell: ({ row }) => (
      <span className="text-xs font-normal text-foreground-light">
        {row.original.lastUpdated}
      </span>
    ),
  },
];

const ProductsPage: FC = () => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: products,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
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
                  className="h-24 text-center"
                >
                  No results.
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
