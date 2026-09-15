'use client';

import {
  Building2,
  ChevronDown,
  Files,
  Hand,
  Radar,
  Search,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
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
import { markLastAccessedBusiness } from '@/features/businesses/api/mark-last-accessed-business';
import { getFaviconUrl } from '@/utils/domain';

type DashboardSidebarProps = {
  businessId: string;
};

export function DashboardSidebar({ businessId }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: business } = useGetBusiness(businessId);
  const { data: businesses = [] } = useBusinesses();

  const contextItems = [
    {
      title: 'Brand Kit',
      href: paths.business.brandKit.getHref(businessId),
      icon: Building2,
    },
  ];

  const insightItems = [
    {
      title: 'Prompts',
      href: paths.business.prompts.getHref(businessId),
      icon: Radar,
    },
    {
      title: 'Onsite',
      href: paths.business.onsite.getHref(businessId),
      icon: Files,
    },
  ];

  const actionItems = [
    {
      title: 'Playbook',
      href: paths.business.playbook.getHref(businessId),
      icon: Hand,
    },
    {
      title: 'Workflows',
      href: paths.business.workflows.getHref(businessId),
      icon: Workflow,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border flex h-12 flex-row items-center gap-0 px-2 transition-[padding] duration-200 ease-linear group-data-[collapsible=icon]:px-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hover:bg-sidebar-accent flex h-8 w-36 min-w-0 items-center gap-3 overflow-hidden rounded-md px-2 text-left transition-[padding,background-color] duration-200 outline-none group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:px-1"
              aria-label={
                business
                  ? `Switch business from ${business.brand.name}`
                  : 'Switch business'
              }
            >
              <Avatar className="size-6 shrink-0 rounded-md">
                <AvatarImage
                  src={getFaviconUrl(business?.brand.domain ?? '')}
                  alt={
                    business
                      ? `${business.brand.name} favicon`
                      : 'Business favicon'
                  }
                />
                <AvatarFallback className="text-primary rounded-md text-sm font-semibold">
                  {business?.brand.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
                {business?.brand.name}
              </span>
              <ChevronDown className="text-foreground-lighter size-4 shrink-0 transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0" />
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
                    href={paths.business.knowledgeBase.getHref(item.id)}
                    className="flex w-full items-center gap-2"
                    onNavigate={() => {
                      if (!isActive) {
                        void markLastAccessedBusiness(item.id).catch(
                          () => undefined,
                        );
                      }
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {item.brand.name}
                    </span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="ml-auto flex shrink-0 items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 group-data-[collapsible=icon]:hidden"
            aria-label="Search"
          >
            <Search />
          </Button>
          <SidebarTrigger className="size-8" />
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-1.5">
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {actionItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.title}
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
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.title}
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
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Context</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contextItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.title}
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
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
