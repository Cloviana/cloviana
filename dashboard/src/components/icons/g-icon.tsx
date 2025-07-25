'use client';

import { cn } from '@/utils/cn';

export function GIcon({
  name,
  size = 16, // px
  className = '',
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('material-symbols-outlined leading-none', className)}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}
