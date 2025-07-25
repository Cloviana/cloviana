'use client';

import Image from 'next/image';
import { FC } from 'react';

export const OfferPreview: FC = () => (
  <Image
    src="https://cloviana-assets.azureedge.net/assets/seascape_rhapsody_20250705T120000Z.png"
    alt="Store background"
    fill
    priority
    className="absolute left-0 top-0 z-10 size-full rounded-xl object-cover"
  />
);
