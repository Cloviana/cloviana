import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import { paths } from '@/config/paths';
import { getBusinessQueryOptions } from '@/features/businesses/api/get-business';
import { BusinessAccessTracker } from '@/features/businesses/components/business-access-tracker';
import { getQueryClient } from '@/lib/react-query/server';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { businessId } = await params;

  const qc = getQueryClient();
  // A dead/foreign businessId (stale bookmark, switched database) should land
  // on the business picker, not an error screen.
  const business = await qc
    .ensureQueryData(getBusinessQueryOptions(businessId))
    .catch(() => null);

  if (!business) {
    redirect(paths.business.getHref());
  }

  return (
    <>
      <BusinessAccessTracker businessId={businessId} />
      {children}
    </>
  );
}
