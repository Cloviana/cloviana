import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from '@tanstack/react-query';

import { MinimalHeader } from '@/app/_components/header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plans } from '@/features/billing/components/plans';
import { getStoreQueryOptions } from '@/features/stores/api/get-store';

interface TrialPageProps {
  params: Promise<{ storeId: string }>;
}

export default async function TrialPage({ params }: TrialPageProps) {
  const { storeId } = await params;
  const qc = new QueryClient();
  const store = await qc.ensureQueryData(getStoreQueryOptions(storeId));

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <main className="bg-studio flex min-h-screen flex-col">
        <header>
          <MinimalHeader />
        </header>
        <ScrollArea className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="mx-auto flex min-h-[500px] max-w-md flex-col gap-16">
            <div className="space-y-[2px] text-center font-semibold">
              <h1 className="text-center text-[21px]/7 font-semibold tracking-tight">
                Start your 14-day free trial
              </h1>
              <div className="text-foreground/40 text-center text-[21px]/7 font-semibold tracking-tight">
                Your automated agency for {store.name} starts today
              </div>
            </div>
            <div className="flex justify-center space-y-2">
              <Plans />
            </div>
            <p className="text-foreground-lighter text-center text-xs">
              Cancel anytime. No charge until day 15. SEO content publishes
              automatically starting this week.
            </p>
          </div>
        </ScrollArea>
      </main>
    </HydrationBoundary>
  );
}
