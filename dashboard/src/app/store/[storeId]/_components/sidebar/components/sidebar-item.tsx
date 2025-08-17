'use client';

import Link from 'next/link';
import { FC } from 'react';

import { GIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

export interface SidebarItemProps {
  label: string;
  href: string;
  icon: string;
  isActive: boolean;
  disabled?: boolean;
}

export const SidebarItem: FC<SidebarItemProps> = ({
  label,
  href,
  icon,
  isActive,
  disabled,
}) => (
  <Link
    href={disabled ? '#' : href}
    aria-disabled={disabled}
    className={cn(
      'flex w-full items-center gap-x-2 rounded-md px-2 py-1 transition-colors hover:bg-surface-300/50',
      isActive && '!bg-surface-300',
      disabled && 'pointer-events-none cursor-not-allowed opacity-50',
    )}
  >
    <GIcon
      name={icon}
      className={cn(
        'shrink-0',
        isActive ? 'text-foreground' : 'text-foreground-light',
      )}
    />
    <span className="text-[13px] font-medium text-foreground">{label}</span>
  </Link>
);
