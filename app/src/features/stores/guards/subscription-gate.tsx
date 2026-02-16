'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo } from 'react';

import { paths } from '@/config/paths';
import { useGetStore } from '@/features/stores/api/get-store';

export const SubscriptionGate = ({ children }: { children: ReactNode }) => {
  const { storeId } = useParams<{ storeId?: string }>();
  const router = useRouter();
  const pathname = usePathname();

  if (!storeId) {
    throw new Error('SubscriptionGate must be used under /[storeId]');
  }

  const { data: store } = useGetStore(storeId);

  const trialPath = useMemo(
    () => paths.store.trial.getHref(storeId),
    [storeId],
  );

  const neverSubscribed = store && !store.subscription;

  useEffect(() => {
    if (!store) return;
    if (!neverSubscribed) return;
    if (pathname === trialPath) return;
    router.replace(trialPath);
  }, [store, neverSubscribed, pathname, trialPath, router]);

  return children;
};
