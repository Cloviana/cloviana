'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';

export function SidebarCollapsibleItem({
  title,
  url,
  icon: Icon,
  isActive,
  items,
}: {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive: boolean;
  items: { title: string; url: string; isActive: boolean }[];
}) {
  const pathname = usePathname();

  return (
    <Collapsible asChild defaultOpen={isActive} open={isActive}>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={title} isActive={pathname === url}>
          <Link href={url}>
            <Icon strokeWidth={2.5} />
            <span>{title}</span>
          </Link>
        </SidebarMenuButton>

        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((sub) => (
              <SidebarMenuSubItem key={sub.title}>
                <SidebarMenuSubButton asChild isActive={sub.isActive}>
                  <Link href={sub.url}>{sub.title}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
