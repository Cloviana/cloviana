import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { getBrandKitQueryOptions } from '@/features/brand-kit/api/get-brand-kit';
import { BrandKitDraftProvider } from '@/features/brand-kit/context/brand-kit-draft-context';
import { getQueryClient } from '@/lib/react-query/server';

type BrandKitLayoutProps = {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
};

export default async function BrandKitLayout({
  children,
  params,
}: BrandKitLayoutProps) {
  const { businessId } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(getBrandKitQueryOptions(businessId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BrandKitDraftProvider businessId={businessId}>
        {children}
      </BrandKitDraftProvider>
    </HydrationBoundary>
  );
}
