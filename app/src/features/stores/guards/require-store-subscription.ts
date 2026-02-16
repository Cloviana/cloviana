import 'server-only';

import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';
import { getStore } from '@/features/stores/api/get-store';

export async function requireStoreSubscription(storeId: string) {
  const store = await getStore(storeId);

  if (!store.subscription) {
    redirect(paths.store.trial.getHref(storeId));
  }
}
