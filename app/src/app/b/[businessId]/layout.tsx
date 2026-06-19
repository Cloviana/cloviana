import { QueryClient } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { paths } from '@/config/paths';
import { getBusinessQueryOptions } from '@/features/businesses/api/get-business';
import { BusinessAccessTracker } from '@/features/businesses/components/business-access-tracker';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { businessId } = await params;

  const qc = new QueryClient();
  const business = await qc.ensureQueryData(
    getBusinessQueryOptions(businessId),
  );

  if (!business) {
    redirect(paths.business.getHref());
  }

  if (business.setupStatus !== 'COMPLETED') {
    redirect(paths.setup.business.detail.getHref(businessId));
  }

  return (
    <>
      <BusinessAccessTracker businessId={businessId} />
      {children}
    </>
  );
}
