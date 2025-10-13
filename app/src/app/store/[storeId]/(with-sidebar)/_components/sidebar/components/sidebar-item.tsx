'use client';

import Link from 'next/link';
import { FC } from 'react';

import { GIcon } from '@/components/deprecated/icons';
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
      'hover:bg-sidebar-item-hover flex w-full items-center gap-x-2 rounded-md px-2 py-1 transition-colors',
      isActive &&
        'border-sidebar-item-border bg-sidebar-item-active/70! border',
      disabled && 'pointer-events-none cursor-not-allowed opacity-50',
    )}
  >
    <GIcon
      name={icon}
      className={cn(
        'shrink-0',
        isActive
          ? 'text-sidebar-item-foreground'
          : 'text-sidebar-item-foreground/70',
      )}
    />
    <span className="text-sidebar-item-foreground text-[13px] font-medium">
      {label}
    </span>
  </Link>
);
