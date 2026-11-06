import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { StoresTableColumns } from './stores-table-columns';

const ROWS = 8;

/** The stores table's shape with placeholder rows, so nothing shifts when the data arrives. */
export function StoresTableSkeleton() {
  return (
    <div role="status" aria-label="Loading stores">
      <Table aria-hidden="true" className="min-w-3xl table-fixed">
        <StoresTableColumns />
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="px-3" />
            <TableHead scope="col">Store</TableHead>
            <TableHead scope="col">Email</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Featured</TableHead>
            <TableHead scope="col">Created</TableHead>
            <TableHead scope="col" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: ROWS }, (_, index) => (
            <TableRow key={index} className="hover:bg-transparent">
              <TableCell className="px-3">
                <Skeleton className="size-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-44" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
