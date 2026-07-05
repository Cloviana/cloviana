'use client';

import { Brain, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  const router = useRouter();
  const pathname = usePathname();
  const [shortcutKeys, setShortcutKeys] = useState(['Ctrl', 'J']);
  const { data: business } = useGetBusiness(businessId);
  const { data: businesses = [] } = useBusinesses();
  const chatHref = paths.business.chat.getHref(businessId);
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

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(window.navigator.platform);

    setShortcutKeys(isMac ? ['⌘', 'J'] : ['Ctrl', 'J']);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

      if (isEditable) {
        return;
      }

      if (event.key.toLowerCase() === 'j' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        router.push(chatHref);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatHref, router]);

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
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:pt-2">
        <div className="px-2 pt-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-0">
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              >
                <Link
                  href={chatHref}
                  aria-current={pathname === chatHref}
                  aria-keyshortcuts="Meta+J Control+J"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Plus className="size-4" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      New Chat
                    </span>
                  </span>
                  <span className="ml-auto flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                    {shortcutKeys.map((key) => (
                      <kbd
                        key={key}
                        className="text-muted-foreground bg-background rounded border px-1.5 py-0.5 text-[11px] leading-none"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </Link>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

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
