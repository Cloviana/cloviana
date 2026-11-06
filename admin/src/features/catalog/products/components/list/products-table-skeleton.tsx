import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ProductsTableColumns } from './products-table-columns';

const ROWS = 8;

/** The products table's shape with placeholder rows, so nothing shifts when the data arrives. */
export function ProductsTableSkeleton() {
  return (
    <div role="status" aria-label="Loading products">
      <Table aria-hidden="true" className="min-w-3xl table-fixed">
        <ProductsTableColumns />
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="px-3" />
            <TableHead scope="col">Product</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Category</TableHead>
            <TableHead scope="col">Offers</TableHead>
            <TableHead scope="col">Last updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: ROWS }, (_, index) => (
            <TableRow key={index} className="hover:bg-transparent">
              <TableCell className="px-3">
                <Skeleton className="size-4" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
