import { FC } from 'react';

import { GlobeIcon, ShopIcon } from '@/components/icons';

interface StoreSummaryCardProps {
  name: string;
  domainUrl: string;
}

export const StoreSummaryCard: FC<StoreSummaryCardProps> = ({
  domainUrl,
  name,
}) => {
  return (
    <div className="z-20 w-full max-w-lg overflow-hidden rounded-xl border text-foreground shadow">
      <div className="border-b bg-surface-100 px-6 py-4">
        <div className="flex items-center gap-x-3">
          <div className="rounded-full bg-primary/10 p-2">
            <ShopIcon className="size-3 fill-primary" />
          </div>

          {name ? (
            <h3 className="text-base font-medium">{name}</h3>
          ) : (
            <div className="h-7 w-44 animate-pulse rounded-full bg-surface-200" />
          )}
        </div>
      </div>
      <div className="bg-white px-6 py-5">
        <div className="flex items-center gap-x-3 rounded-md border p-2 shadow-inner">
          <GlobeIcon className="size-3.5 fill-foreground-lighter" />
          <h3 className="text-sm">https://{domainUrl}</h3>
        </div>
      </div>
    </div>
  );
};
