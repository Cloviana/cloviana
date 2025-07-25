'use client';

import Image from 'next/image';
import { FC } from 'react';

import { FormValues } from './store-setup-section';
import { StoreSummaryCard } from './store-summary-card';

interface StorePreviewSectionProps {
  name: FormValues['name'];
  domainUrl: FormValues['domainUrl'];
}

export const StorePreviewSection: FC<StorePreviewSectionProps> = ({
  name,
  domainUrl,
}) => (
  <>
    <Image
      src="https://cloviana-assets.azureedge.net/assets/cloudscape_reverie_20250705T120000Z.png"
      alt="Store background"
      fill
      priority
      className="absolute left-0 top-0 z-10 size-full rounded-xl object-cover"
    />
    <div className="z-20 flex size-full items-center justify-center">
      <StoreSummaryCard name={name} domainUrl={domainUrl} />
    </div>
  </>
);
