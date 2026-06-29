'use client';

import { Brain, Check, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { paths } from '@/config/paths';
import { useGetBusiness } from '@/features/businesses/api/get-business';
import { useBusinesses } from '@/features/businesses/api/get-businesses';

type DashboardSidebarProps = {
  businessId: string;
};

export function DashboardSidebar({ businessId }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: business } = useGetBusiness(businessId);
  const { data: businesses = [] } = useBusinesses();
  const knowledgeHref = paths.business.knowledge.getHref(businessId);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    business?.domain ?? '',
  )}&sz=64`;

  const mainItems = [
    {
      title: 'Knowledge',
      href: knowledgeHref,
      icon: Brain,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border h-12 border-b px-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hover:bg-sidebar-accent flex h-8 w-full min-w-0 items-center gap-3 rounded-md px-2 text-left transition-colors outline-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0"
              aria-label={
                business
                  ? `Switch business from ${business.name}`
                  : 'Switch business'
              }
            >
              <Avatar className="size-6 rounded-md">
                <AvatarImage
                  src={faviconUrl}
                  alt={
                    business ? `${business.name} favicon` : 'Business favicon'
                  }
                />
                <AvatarFallback className="text-primary rounded-md text-sm font-semibold">
                  {business?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground flex-1 truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
                {business?.name}
              </span>
              <ChevronDown className="text-foreground-lighter size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="bottom"
            align="start"
            sideOffset={8}
            alignOffset={6}
            className="group/dropdown-menu-content w-72"
          >
            {businesses.map((item) => {
              const isActive = item.id === businessId;

              return (
                <DropdownMenuItem key={item.id} asChild data-active={isActive}>
                  <Link
                    href={paths.business.knowledge.getHref(item.id)}
                    className="flex w-full items-center gap-2"
                  >
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {isActive && <Check className="size-4" strokeWidth={2.7} />}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:pt-2">
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="text-foreground-lighter gap-1.5">
                <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
                <span>Workspace</span>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                  {mainItems.map((item) => (
                    <SidebarMenuItem
                      key={item.href}
                      className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center"
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                        className="group-data-[collapsible=icon]:mx-auto"
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:items-center">
        <div className="w-full">
          <SidebarTrigger className="mr-auto size-8 group-data-[collapsible=icon]:mx-auto" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
