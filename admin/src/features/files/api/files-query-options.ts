import { infiniteQueryOptions } from '@tanstack/react-query';

import { listFilesAction } from '../actions/list-files';
import type { FileListParams } from '../types/file';

export const fileKeys = {
  all: (slug: string) => ['files', slug] as const,
  pages: (slug: string, params: Omit<FileListParams, 'cursor'>) =>
    [...fileKeys.all(slug), 'pages', params] as const,
};
export function filePagesQueryOptions(
  slug: string,
  input: Omit<FileListParams, 'cursor'> = {},
) {
  const params = {
    query: input.query?.trim().toLowerCase() || undefined,
    type: input.type,
    minSize: input.minSize,
    maxSize: input.maxSize,
    productId: input.productId?.toLowerCase(),
    sort: input.sort ?? 'newest',
    limit: input.limit ?? 30,
  } as const;
  return infiniteQueryOptions({
    queryKey: fileKeys.pages(slug, params),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      listFilesAction(slug, { ...params, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60 * 1000,
  });
}
