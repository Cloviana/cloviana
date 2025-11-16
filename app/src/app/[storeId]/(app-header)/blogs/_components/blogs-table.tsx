'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { differenceInYears, format } from 'date-fns';
import { Image, Key } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';
import { useGetBlogs } from '@/features/blogs/api/get-blogs';
import { Blog, BlogStatus, Thumbnail } from '@/types/api';
import { cn } from '@/utils/cn';

const blogColumns: ColumnDef<Blog>[] = [
  {
    accessorKey: 'blog',
    header: 'Blog posts',
    cell: ({ row }) => {
      const topic = row.original.topic as string | undefined;
      const thumbnail = row.original.thumbnail as Thumbnail | null | undefined;
      const primaryKeyword = row.original.primaryKeyword as string;

      return (
        <div className="flex min-w-40 items-center gap-2">
          <Avatar className="bg-muted/60 hidden size-8 rounded-md md:block">
            <AvatarImage
              src={thumbnail?.srcUrl}
              alt={thumbnail?.altText || 'thumbnail'}
              className="rounded-md object-cover object-center"
            />
            <AvatarFallback className="bg-muted rounded-md border">
              <Image className="text-muted-foreground size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="max-w-2xs space-y-[2px]">
            <span className="line-clamp-1 text-[13px] leading-tight font-medium tracking-tight group-hover:underline">
              {topic}
            </span>
            <div className="text-foreground-light flex items-center gap-1 text-xs">
              <Key className="size-3 shrink-0" />
              {primaryKeyword?.trim() || '-'}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as BlogStatus;
      return (
        <div className="text-[13px] capitalize">{status.toLowerCase()}</div>
      );
    },
  },
  {
    accessorKey: 'productsCount',
    header: () => <div className="w-full text-center">Products</div>,
    cell: ({ row }) => {
      const productsCount = row.getValue('productsCount') as number;
      return (
        <div className="flex flex-col justify-center gap-[2px] text-center">
          <div className="text-[13px] leading-none">{productsCount}</div>
          <div className="text-foreground-light text-xs leading-none">used</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const value = row.original.createdAt;
      const date = value ? new Date(value) : null;
      return (
        <div className="text-foreground-light text-[13px]">
          {date
            ? format(
                date,
                Math.abs(differenceInYears(new Date(), date)) >= 1
                  ? 'd MMM yyyy'
                  : 'd MMM',
              )
            : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row }) => {
      const value = row.original.updatedAt;
      const date = value ? new Date(value) : null;
      return (
        <div className="text-foreground-light text-[13px]">
          {date
            ? format(
                date,
                Math.abs(differenceInYears(new Date(), date)) >= 1
                  ? 'd MMM yyyy'
                  : 'd MMM',
              )
            : '-'}
        </div>
      );
    },
  },
];

export const BlogsTable = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: blogs = [] } = useGetBlogs(storeId);
  const { push } = useRouter();

  const onBlogClick = (blogId: string) => {
    push(paths.store.blogs.editor.getHref(storeId, blogId));
  };

  const table = useReactTable({
    data: blogs,
    columns: blogColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'px-4 text-xs',
                      header.column.columnDef.meta?.className,
                    )}
                  >
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onBlogClick(row.original.id)}
                  className="group cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'px-4',
                        cell.column.columnDef.meta?.className,
                      )}
                    >
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
                  colSpan={blogColumns.length}
                  className="text-foreground-lighter h-24 text-center text-sm"
                >
                  No blogs yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
