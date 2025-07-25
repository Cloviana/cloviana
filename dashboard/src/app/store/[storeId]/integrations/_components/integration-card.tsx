'use client';

import Image from 'next/image'; // remove or replace if not using Next.js
import React, { FC } from 'react';

import { BadgeCheckOutlineIcon } from '@/components/icons';

interface IntegrationCardProps {
  title: string;
  description: string;
  iconSrc: string;
  badgeLabel?: string;
  active?: boolean;
}

export const IntegrationCard: FC<IntegrationCardProps> = ({
  title,
  description,
  iconSrc,
  badgeLabel,
  active = false,
}) => (
  <div className="flex size-full cursor-pointer gap-3 rounded-md border border-border bg-surface-100 p-3 transition-all duration-200 ease-out hover:bg-surface-200">
    <div className="relative flex size-10 shrink-0 items-center justify-center rounded-md border bg-white p-2">
      <Image
        src={iconSrc}
        alt={`${title} icon`}
        fill
        priority
        sizes="40px"
        className="object-contain"
      />
    </div>

    <div className="flex grow flex-col justify-between">
      <div className="text-left">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-xs text-foreground-light">{description}</p>
      </div>

      <div className="mt-2 flex items-center gap-3">
        {badgeLabel && (
          <span className="self-start rounded-full border bg-surface-300 px-2.5 py-0.5 text-xs text-foreground-light">
            {badgeLabel}
          </span>
        )}

        {active && (
          <div className="flex h-full items-center gap-1">
            <BadgeCheckOutlineIcon className="size-3 fill-green-600" />
            <span className="text-xs text-green-600">Active</span>
          </div>
        )}
      </div>
    </div>
  </div>
);
