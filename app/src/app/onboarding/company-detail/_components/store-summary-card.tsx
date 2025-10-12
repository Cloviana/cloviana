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
    <div className="text-foreground z-20 w-full max-w-lg overflow-hidden rounded-xl border shadow-sm">
      <div className="bg-surface-100 border-b px-6 py-4">
        <div className="flex items-center gap-x-3">
          <div className="bg-primary/10 rounded-full p-2">
            <ShopIcon className="fill-primary size-3" />
          </div>

          {name ? (
            <h3 className="text-base font-medium">{name}</h3>
          ) : (
            <div className="bg-surface-200 h-7 w-44 animate-pulse rounded-full" />
          )}
        </div>
      </div>
      <div className="bg-white px-6 py-5">
        <div className="flex items-center gap-x-3 rounded-md border p-2 shadow-inner">
          <GlobeIcon className="fill-foreground-lighter size-3.5" />
          <h3 className="text-sm">https://{domainUrl}</h3>
        </div>
      </div>
    </div>
  );
};
