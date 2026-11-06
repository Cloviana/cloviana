// With a fixed table layout the columns keep these widths whatever is in them, so nothing moves
// between the loading skeleton, the rows and a page or filter change. "Created" takes what is left.
export function StoresTableColumns() {
  return (
    <colgroup>
      <col className="w-10" />
      <col className="w-[30%]" />
      <col className="w-[26%]" />
      <col className="w-[12%]" />
      <col className="w-[10%]" />
      <col />
      <col className="w-12" />
    </colgroup>
  );
}
