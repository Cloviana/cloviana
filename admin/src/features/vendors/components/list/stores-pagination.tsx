import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

/** "1–50 of 120 stores" with previous and next buttons. Render it only when there is more than one page. */
export function StoresPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.ceil(total / pageSize);
  const firstRow = (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-end gap-4 py-2">
      <span className="text-body text-text-subtle" aria-live="polite">
        {firstRow}–{lastRow} of {total} stores
      </span>
      <Pagination aria-label="Store pagination" className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              size="icon"
              text=""
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            />
          </PaginationItem>
          <PaginationItem>
            <span
              className="text-body text-text-subtle px-2"
              aria-live="polite"
            >
              Page {page} of {pageCount}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              size="icon"
              text=""
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
