import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';

import { ChatHistoryCommand } from '@/features/chat/components/chat-history-command';
import { ChatWithCanvas } from '@/features/chat/components/chat-with-canvas';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';

type PageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function ChatPage({ params }: PageProps) {
  const { businessId } = await params;
  const queryClient = new QueryClient();

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
          <ChatWithCanvas businessId={businessId} />
        </Suspense>
      </DashboardPageLayout>
    </HydrationBoundary>
  );
}
