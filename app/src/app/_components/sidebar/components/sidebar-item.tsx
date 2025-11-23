'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

export function SidebarItem({
  title,
  url,
  icon: Icon,
  isActive,
}: {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={title} isActive={isActive}>
        <Link href={url}>
          <Icon strokeWidth={2.5} />
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
