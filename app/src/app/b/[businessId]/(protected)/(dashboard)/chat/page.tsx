import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';

import { getChatsQueryOptions } from '@/features/chat/api/get-chats';
import { ChatHistoryCommand } from '@/features/chat/components/chat-history-command';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import { getQueryClient } from '@/lib/react-query/server';

type PageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function ChatPage({ params }: PageProps) {
  const { businessId } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(getChatsQueryOptions(businessId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPageLayout
        header={
          <DashboardHeader>
            <ChatHistoryCommand businessId={businessId} />
          </DashboardHeader>
        }
        className="overflow-hidden p-0"
      >
        <Suspense>
          <ChatThread businessId={businessId} />
        </Suspense>
      </DashboardPageLayout>
    </HydrationBoundary>
  );
}
