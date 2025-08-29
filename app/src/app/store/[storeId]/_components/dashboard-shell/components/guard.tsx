'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useParams, usePathname } from 'next/navigation';
import { FC, ReactNode, useEffect, useRef } from 'react';

import { useGetStore } from '@/api/stores/get-store';
import { useGetStoreStatus } from '@/api/stores/get-store-status';
import { Anchor } from '@/components/actions';
import { LoadingDots } from '@/components/animations';
import { paths } from '@/config/paths';

interface GuardProps {
  children: ReactNode;
}

export const Guard: FC<GuardProps> = ({ children }) => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: store } = useGetStore(storeId);
  const { data: storeStatus } = useGetStoreStatus(storeId, {
    config: {
      refetchInterval: (q) =>
        q.state.data?.status === 'INITIALIZING' ? 5000 : false,
    },
  });
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const effectiveStatus = storeStatus?.status ?? store?.status;

  const prevStatus = useRef<string | null>(null);
  useEffect(() => {
    if (prevStatus.current === 'INITIALIZING' && effectiveStatus === 'ACTIVE') {
      // when store flips to ACTIVE -> invalidate all queries
      queryClient.invalidateQueries();
    }
    prevStatus.current = effectiveStatus ?? null;
  }, [effectiveStatus, queryClient]);

  if (!effectiveStatus) return null;

  const integrationsHref = paths.store.integrations.getHref(storeId);

  if (effectiveStatus === 'LOCKED') {
    if (pathname.startsWith(integrationsHref)) return children;

    return (
      <div className="grid min-h-full place-items-center px-6 py-16">
        <div className="flex max-w-md flex-col items-center gap-2 text-center">
          <img
            src="/logo-icon.png"
            alt="logo"
            width={30}
            fetchPriority="high"
            className="mb-2"
          />
          <h2 className="text-sm font-medium text-foreground">Store Locked</h2>
          <p className="text-xs text-foreground-light">
            This store is locked because your Shopify store isn’t connected.
            Please{' '}
            <Anchor href={integrationsHref} className="text-xs">
              connect your store
            </Anchor>{' '}
            to unlock all features.
          </p>
        </div>
      </div>
    );
  }

  if (effectiveStatus === 'INITIALIZING') {
    if (pathname.startsWith(integrationsHref)) return children;

    return (
      <div className="grid min-h-full place-items-center px-6 py-16">
        <div className="flex max-w-md flex-col items-center gap-2 text-center">
          <LoadingDots size="sm" />
          <h2 className="text-sm font-medium text-foreground">
            Preparing Your Store
          </h2>
          <p className="text-xs text-foreground-light">
            We’re initializing your store and syncing data. This may take a
            moment.
          </p>
        </div>
      </div>
    );
  }

  return children;
};
