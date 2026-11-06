// With a fixed table layout the columns keep these widths whatever is in them, so nothing moves
// between the loading skeleton, the rows and a page or filter change. "Last updated" takes what is left.
export function ProductsTableColumns() {
  return (
    <colgroup>
      <col className="w-10" />
      <col className="w-[40%]" />
      <col className="w-[12%]" />
      <col className="w-[18%]" />
      <col className="w-[12%]" />
      <col />
    </colgroup>
  );
}
