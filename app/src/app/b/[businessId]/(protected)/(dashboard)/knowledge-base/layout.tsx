import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { getDocumentsQueryOptions } from '@/features/knowledge/api/get-documents';
import { getFoldersQueryOptions } from '@/features/knowledge/api/get-folders';
import { getQueryClient } from '@/lib/react-query/server';

type KnowledgeBaseLayoutProps = {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
};

export default async function KnowledgeBaseLayout({
  children,
  params,
}: KnowledgeBaseLayoutProps) {
  const { businessId } = await params;
  const queryClient = getQueryClient();

  // Folders first — listing them lazily creates the business's Default folder.
  await queryClient.prefetchQuery(getFoldersQueryOptions(businessId));
  await queryClient.prefetchQuery(getDocumentsQueryOptions(businessId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
