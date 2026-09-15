'use client';

import { useParams, useSearchParams } from 'next/navigation';

import { PaginationControl } from '@/components/ui/pagination';
import { useGetPromptResponses } from '@/features/prompts/api/get-prompt-responses';
import { getPromptResponseListQuery } from '@/features/prompts/list-queries';
import { useUrlPagination } from '@/hooks/use-url-pagination';

export function ResponsesPagination() {
  const { businessId } = useParams<{ businessId: string }>();
  const searchParams = useSearchParams();
  const listQuery = getPromptResponseListQuery(searchParams);
  const responsesQuery = useGetPromptResponses({ businessId, ...listQuery });
  const { page, setPage } = useUrlPagination();
  const pageInfo = responsesQuery.data?.pageInfo;

  return (
    <div className="bg-surface shrink-0 border-t px-3 py-2">
      <PaginationControl
        page={pageInfo?.page ?? page}
        totalPages={pageInfo?.totalPages ?? 1}
        onPageChange={setPage}
        disabled={responsesQuery.isFetching}
        itemLabel="responses"
      />
    </div>
  );
}
