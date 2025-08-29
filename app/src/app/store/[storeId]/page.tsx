import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

interface OverviewPageProps {
  params: {
    storeId: string;
  };
}

export default async function OverviewPage({
  params: { storeId },
}: OverviewPageProps) {
  redirect(paths.store.integrations.getHref(storeId));
}
