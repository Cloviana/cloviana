import { QueryClient } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';

import { paths } from '@/config/paths';
import { getBusinessSetupQueryOptions } from '@/features/businesses/api/business-setup';

type BusinessSetupLayoutProps = {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
};

export default async function BusinessSetupLayout({
  children,
  params,
}: BusinessSetupLayoutProps) {
  const { businessId } = await params;

  const queryClient = new QueryClient();
  const setup = await queryClient.ensureQueryData(
    getBusinessSetupQueryOptions(businessId),
  );

  if (setup.business.setupStatus === 'COMPLETED') {
    redirect(paths.business.getHref(businessId));
  }

  return <>{children}</>;
}
