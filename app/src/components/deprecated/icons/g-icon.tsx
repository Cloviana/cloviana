'use client';

import { cn } from '@/utils/cn';

export function GIcon({
  name,
  className,
  size = 16,
  fill = false,
}: {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn('material-symbols-rounded leading-none', className)}
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}`,
      }}
    >
      {name}
    </span>
  );
}
