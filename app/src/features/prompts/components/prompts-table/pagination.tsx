'use client';

import { useParams, useSearchParams } from 'next/navigation';

import { PaginationControl } from '@/components/ui/pagination';
import { useGetPrompts } from '@/features/prompts/api/get-prompts';
import { getPromptListQuery } from '@/features/prompts/list-queries';
import { useUrlPagination } from '@/hooks/use-url-pagination';

export function PromptsPagination() {
  const { businessId } = useParams<{ businessId: string }>();
  const searchParams = useSearchParams();
  const listQuery = getPromptListQuery(searchParams);
  const promptsQuery = useGetPrompts({ businessId, ...listQuery });
  const { page, setPage } = useUrlPagination();
  const pageInfo = promptsQuery.data?.pageInfo;

  return (
    <div className="bg-surface shrink-0 border-t px-3 py-2">
      <PaginationControl
        page={pageInfo?.page ?? page}
        totalPages={pageInfo?.totalPages ?? 1}
        onPageChange={setPage}
        disabled={promptsQuery.isFetching}
        itemLabel="prompts"
      />
    </div>
  );
}
