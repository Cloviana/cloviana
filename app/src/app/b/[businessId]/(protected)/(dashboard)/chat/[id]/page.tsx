import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { Suspense } from 'react';

import { ChatThread } from '@/features/chat/components/chat-thread';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatDetailPage({ params }: PageProps) {
  const { id } = await params;
  const queryClient = new QueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPageLayout header={<DashboardHeader />} className="p-0">
        <Suspense>
          <ChatThread chatId={id} />
        </Suspense>
      </DashboardPageLayout>
    </HydrationBoundary>
  );
}
