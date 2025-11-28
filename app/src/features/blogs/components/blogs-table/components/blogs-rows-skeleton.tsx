'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { TableRow, TableCell } from '@/components/ui/table';

export const BlogRowsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {/* Topic */}
          <TableCell>
            <div className="flex min-w-40 items-center gap-2">
              <div className="hidden md:block">
                <Skeleton className="size-8 rounded-md" />
              </div>
              <div className="max-w-2xs space-y-[4px]">
                <Skeleton className="h-3 w-40 rounded-sm" />
                <Skeleton className="h-3 w-28 rounded-sm" />
              </div>
            </div>
          </TableCell>

          {/* Status */}
          <TableCell>
            <Skeleton className="h-3 w-16 rounded-sm" />
          </TableCell>

          {/* Products */}
          <TableCell>
            <div className="flex flex-col items-center gap-[4px]">
              <Skeleton className="h-3 w-6 rounded-sm" />
              <Skeleton className="h-3 w-10 rounded-sm" />
            </div>
          </TableCell>

          {/* Last modified */}
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-3 w-24 rounded-sm" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};
