'use client';

import { useParams, usePathname } from 'next/navigation';
import { FC, ReactNode } from 'react';

import { useGetStore } from '@/api/stores/get-store';
import { Anchor } from '@/components/actions';
import { LoadingDots } from '@/components/animations';
import { paths } from '@/config/paths';

interface GuardProps {
  children: ReactNode;
}

export const Guard: FC<GuardProps> = ({ children }) => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: store } = useGetStore(storeId);
  const pathname = usePathname();

  if (!store) return null;

  const integrationsHref = paths.store.integrations.getHref(storeId);

  if (store.status === 'LOCKED') {
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

  if (store.status === 'INITIALIZING')
    return (
      <div className="grid min-h-full place-items-center px-6 py-16">
        <div className="flex max-w-md flex-col items-center gap-2 text-center">
          <LoadingDots size={'sm'} />
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

  return children;
};
