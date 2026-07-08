import { Suspense } from 'react';

import { ChatHistoryCommand } from '@/features/chat/components/chat-history-command';
import { ChatThread } from '@/features/chat/components/chat-thread';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';

type PageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function ChatPage({ params }: PageProps) {
  const { businessId } = await params;

  return (
<<<<<<< HEAD
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
=======
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
>>>>>>> b9092495db5dd80d333a525a2c701471261db8e2
  );
}
