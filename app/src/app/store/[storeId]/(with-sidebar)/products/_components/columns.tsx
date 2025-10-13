'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Product } from '@/types/api';

import ProductImage from './product-image';

function formatDate(value?: string | Date | null) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <ProductImage url={row.original.imageUrl} alt="product-image" />
        <div className="min-w-0 flex-1 font-medium">
          <p className="truncate text-xs">{row.original.title}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const value = row.original.status;
      return (
        <span className="text-xs">
          {value ? value.toUpperCase() : 'No status provided'}
        </span>
      );
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const value = row.original.category;
      return <span className="text-xs">{value || 'No category provided'}</span>;
    },
  },
  {
    accessorKey: 'handle',
    header: 'Handle',
    cell: ({ row }) => {
      const value = row.original.handle;
      return <span className="text-xs">{value || 'No handle provided'}</span>;
    },
  },
  {
    accessorKey: 'syncedAt',
    header: 'Sync',
    cell: ({ row }) => {
      const value = formatDate(row.original.syncedAt);
      return (
        <span className="text-xs">{value || 'No sync date provided'}</span>
      );
    },
    meta: { align: 'right' },
  },
];
