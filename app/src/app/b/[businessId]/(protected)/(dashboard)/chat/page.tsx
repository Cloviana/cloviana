import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';

import { ChatThread } from '@/features/chat/components/chat-thread';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';

export default async function ChatPage() {
  const queryClient = new QueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPageLayout
        header={<DashboardHeader />}
        className="overflow-hidden p-0"
      >
        <Suspense>
          <ChatThread />
        </Suspense>
      </DashboardPageLayout>
    </HydrationBoundary>
  );
}
