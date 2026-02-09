'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo } from 'react';

import { LoadingFallback } from '@/components/fallbacks/loading-fallback';
import { paths } from '@/config/paths';
import { useGetStore } from '@/features/stores/api/get-store';
import { useGetStoreStatus } from '@/features/stores/api/get-store-status';

export const ShopifyConnectionGate = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { storeId } = useParams<{ storeId?: string }>();
  const router = useRouter();
  const pathname = usePathname();

  if (!storeId) {
    throw new Error('ShopifyConnectionGate must be used under /[storeId]');
  }

  const { data: store, refetch: refetchStore } = useGetStore(storeId);
  const shopifyConnected = Boolean(store?.channel);

  const { data: storeStatus } = useGetStoreStatus(storeId, {
    config: {
      enabled: Boolean(storeId && store?.status === 'INITIALIZING'),
      refetchInterval: 10_000,
    },
  });

  const status = storeStatus?.status ?? store?.status;
  const isInitializing = status === 'INITIALIZING';

  useEffect(() => {
    if (!status || status === 'INITIALIZING') return;
    refetchStore();
  }, [status, refetchStore]);

  const integrationsPath = useMemo(
    () => paths.store.settings.integrations.getHref(storeId),
    [storeId],
  );

  useEffect(() => {
    if (!store) return;
    if (isInitializing) return;
    if (shopifyConnected) return;
    if (pathname === integrationsPath) return;
    router.replace(integrationsPath);
  }, [
    store,
    isInitializing,
    shopifyConnected,
    pathname,
    integrationsPath,
    router,
  ]);

  if (!store) return null;

  if (isInitializing) {
    return <LoadingFallback />;
  }

  return children;
};
