'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo } from 'react';

import { paths } from '@/config/paths';
import { useGetStore } from '@/features/stores/api/get-store';

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

  const { data: store } = useGetStore(storeId);
  const shopifyConnected = Boolean(store?.channel);

  const integrationsPath = useMemo(
    () => paths.store.settings.integrations.getHref(storeId),
    [storeId],
  );

  useEffect(() => {
    if (!store) return;
    if (shopifyConnected) return;
    if (pathname === integrationsPath) return;
    router.replace(integrationsPath);
  }, [store, shopifyConnected, pathname, integrationsPath, router]);

  if (!store) return null;

  return children;
};
