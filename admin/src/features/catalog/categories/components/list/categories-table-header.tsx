import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

// With a fixed table layout the columns keep these widths whatever is in them, so nothing moves
// between the loading skeleton, the rows and a branch being expanded. Products takes what is left.
export function CategoriesTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead scope="col" className="w-[40%]">
          Name
        </TableHead>
        <TableHead scope="col" className="w-[25%]">
          Handle
        </TableHead>
        <TableHead scope="col" className="w-[15%]">
          Status
        </TableHead>
        <TableHead scope="col">Products</TableHead>
        <TableHead scope="col" className="w-14">
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
