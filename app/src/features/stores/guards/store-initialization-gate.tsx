'use client';

import { useParams } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useGetStore } from '@/features/stores/api/get-store';
import { useGetStoreStatus } from '@/features/stores/api/get-store-status';

export const StoreInitializationGate = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { storeId } = useParams<{ storeId?: string }>();

  if (!storeId) {
    throw new Error('StoreInitializationGate must be used under /[storeId]');
  }

  const { data: store, refetch: refetchStore } = useGetStore(storeId);

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

  if (!store) return null;

  if (isInitializing) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex max-w-sm flex-col items-center gap-6">
          <Spinner
            className="text-foreground-light size-7"
            strokeWidth={3.4}
            variant="2"
          />
          <p className="text-foreground-lighter text-center text-xs">
            We are initializing your store by connecting your account and
            syncing your products and collections.
          </p>
        </div>
      </div>
    );
  }

  return children;
};
