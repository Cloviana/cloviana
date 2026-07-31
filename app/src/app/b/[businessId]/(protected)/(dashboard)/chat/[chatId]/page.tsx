import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';

import { getChatMessagesQueryOptions } from '@/features/chat/api/get-chat-messages';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import { getQueryClient } from '@/lib/react-query/server';

type PageProps = {
  params: Promise<{ businessId: string; chatId: string }>;
};

export default async function ChatDetailPage({ params }: PageProps) {
  const { businessId, chatId } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(
    getChatMessagesQueryOptions(businessId, chatId),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPageLayout contentWidth="full" className="overflow-hidden p-0">
        <Suspense>
          <ChatThread key={chatId} businessId={businessId} chatId={chatId} />
        </Suspense>
      </DashboardPageLayout>
    </HydrationBoundary>
  );
}
