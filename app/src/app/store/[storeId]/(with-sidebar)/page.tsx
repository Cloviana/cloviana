import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

interface OverviewPageProps {
  params: Promise<{
    storeId: string;
  }>;
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { storeId } = await params;
  redirect(paths.store.integrations.getHref(storeId));
}
