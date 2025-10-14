'use client';

import { Blocks, PenTool } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { paths } from '@/config/paths';
import { SUPPORT_EMAIL } from '@/constants/emails';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { storeId } = useParams() as { storeId: string };
  const pathname = usePathname();

  const items = [
    {
      title: 'Content Creation',
      url: paths.store.blogs.getHref(storeId),
      icon: PenTool,
      isActive: pathname.startsWith(paths.store.blogs.getHref(storeId)),
    },
    {
      title: 'Integrations',
      url: paths.store.integrations.getHref(storeId),
      icon: Blocks,
      isActive: pathname.startsWith(paths.store.integrations.getHref(storeId)),
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex px-2.5">
          <Link
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Support request')}`}
            aria-label="Contact support"
            className="flex items-center justify-center rounded-full"
          >
            <p className="text-sidebar-item-foreground text-center text-[10px]">
              Desktop-first dashboard; mobile support coming soon. Use a laptop
              for the best experience—stay tuned for new features!
            </p>
          </Link>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
