import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive: boolean;
    items?: {
      title: string;
      url: string;
      isActive?: boolean;
    }[];
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = Boolean(item.items?.length);

            if (!hasChildren) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size="default"
                    isActive={item.isActive}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <Collapsible
                key={item.title}
                defaultOpen={
                  item.title.toLocaleLowerCase() === 'settings' || item.isActive
                }
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton size="default">
                      <item.icon />
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronRight className="ml-1 size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={child.isActive}
                          >
                            <Link href={child.url}>{child.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
