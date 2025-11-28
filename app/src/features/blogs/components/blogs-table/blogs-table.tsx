'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useParams, useRouter } from 'next/navigation';

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
import { BlogRowsSkeleton } from '@/features/blogs/components/blogs-table/components/blogs-rows-skeleton';
import { BlogTableEmpty } from '@/features/blogs/components/blogs-table/components/blogs-table-empty';
import { BlogsTableFooter } from '@/features/blogs/components/blogs-table/components/blogs-table-footer';
import { cn } from '@/utils/cn';

import { blogColumns } from './components/blogs-table-columns';
import { BlogsTableToolbar } from './components/blogs-table-toolbar';
import { useBlogsTableQuery } from './hooks/use-blogs-table-query';

export const BlogsTable = () => {
  const router = useRouter();
  const { storeId } = useParams<{ storeId: string }>();

  const { queryParams } = useBlogsTableQuery();

  const { data, isLoading, isFetching } = useGetBlogs(storeId, {
    params: queryParams,
  });
  const blogs = data?.data ?? [];

  const table = useReactTable({
    data: blogs,
    columns: blogColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRowClick = (blogId: string) => {
    router.push(paths.store.blogs.editor.getHref(storeId, blogId));
  };

  const isTableLoading = isLoading || (isFetching && blogs.length === 0);
  const showEmptyState = !isTableLoading && blogs.length === 0;
  const showFooter = !isTableLoading && !showEmptyState;

  return (
    <div className="flex w-full flex-col gap-3">
      <BlogsTableToolbar />

      <div
        className={cn(
          'overflow-hidden rounded-lg border bg-white',
          showEmptyState && 'hidden',
        )}
      >
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

          {/* Only render Body if we are loading or have data */}
          {!showEmptyState && (
            <TableBody>
              {isTableLoading ? (
                <BlogRowsSkeleton />
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => handleRowClick(row.original.id)}
                    className="group hover:bg-muted/50 cursor-pointer transition-colors"
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
              )}
            </TableBody>
          )}
        </Table>
      </div>
      {showEmptyState && <BlogTableEmpty />}

      {showFooter && <BlogsTableFooter />}
    </div>
  );
};
