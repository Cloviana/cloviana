import { Skeleton } from '@/components/ui/skeleton';
import { TableBody, TableCell } from '@/components/ui/table';
import {
  TreeTable,
  TreeTableLevel,
  TreeTableLoadingRows,
} from '@/components/ui/tree-table';

import { CategoriesTableHeader } from './categories-table-header';

const ROWS = 8;

/** The categories table's shape with placeholder rows, so nothing shifts when the data arrives. */
export function CategoriesTableSkeleton() {
  return (
    <TreeTable aria-label="Categories" aria-busy="true">
      <CategoriesTableHeader />
      <TableBody>
        <TreeTableLevel>
          <TreeTableLoadingRows count={ROWS} label="Loading categories">
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell />
          </TreeTableLoadingRows>
        </TreeTableLevel>
      </TableBody>
    </TreeTable>
  );
}
