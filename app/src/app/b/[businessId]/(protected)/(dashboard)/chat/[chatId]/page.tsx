import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';

import { getChatMessagesQueryOptions } from '@/features/chat/api/get-chat-messages';
import { ChatHistoryCommand } from '@/features/chat/components/chat-history-command';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';

type PageProps = {
  params: Promise<{ businessId: string; chatId: string }>;
};

export default async function ChatDetailPage({ params }: PageProps) {
  const { businessId, chatId } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(
    getChatMessagesQueryOptions(businessId, chatId),
  );

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
          <ChatThread key={chatId} businessId={businessId} chatId={chatId} />
        </Suspense>
      </DashboardPageLayout>
    </HydrationBoundary>
  );
}
