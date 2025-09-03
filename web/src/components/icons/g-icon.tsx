'use client';

import { ICON_NAMES } from '@/config/material-symbols';
import { cn } from '@/utils/cn';

type IconName = (typeof ICON_NAMES)[number];

export function GIcon({
  name,
  className,
  size = 16,
  fill = false,
}: {
  name: IconName;
  size?: number;
  fill?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'material-symbols-rounded leading-none text-current',
        className,
      )}
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}`,
      }}
    >
      {name}
    </span>
  );
}
