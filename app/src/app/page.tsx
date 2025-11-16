import { QueryClient } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { getStoresQueryOptions } from '@/api/stores/get-stores';
import { paths } from '@/config/paths';

export default async function HomePage() {
  const qc = new QueryClient();
  const stores = await qc.ensureQueryData(getStoresQueryOptions());
  const activeStores = stores?.filter((s) => s.status !== 'DRAFT') ?? [];

  if (activeStores.length === 0) {
    redirect(paths.onboarding.getHref());
  }

  redirect(paths.store.blogs.getHref(activeStores[0].id));
}
