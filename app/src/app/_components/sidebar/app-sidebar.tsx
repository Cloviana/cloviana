'use client';

import { Package, PenTool } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { paths } from '@/config/paths';

import { SidebarCollapsibleItem } from './components/sidebar-collapsible-item';
import { SidebarItem } from './components/sidebar-item';

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { storeId } = useParams<{ storeId: string }>();
  const pathname = usePathname();

  const blogsHref = storeId ? paths.store.blogs.getHref(storeId) : '#';
  const productsHref = storeId ? paths.store.products.getHref(storeId) : '#';
  const collectionsHref = storeId
    ? paths.store.products.collections.getHref(storeId)
    : '#';

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarContent>
        <SidebarGroup>
          {/*<SidebarGroupLabel>Platform</SidebarGroupLabel>*/}
          <SidebarMenu>
            <SidebarItem
              title="Content Creation"
              url={blogsHref}
              icon={PenTool}
              isActive={pathname?.startsWith(blogsHref)}
            />

            <SidebarCollapsibleItem
              title="Products"
              url={productsHref}
              icon={Package}
              isActive={pathname?.startsWith(productsHref)}
              items={[
                {
                  title: 'Collections',
                  url: paths.store.products.collections.getHref(storeId),
                  isActive: pathname?.startsWith(collectionsHref),
                },
              ]}
            />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
