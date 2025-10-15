'use client';

import { Blocks, PenTool } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { paths } from '@/config/paths';

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

      <SidebarRail />
    </Sidebar>
  );
}
