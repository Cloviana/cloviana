'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

import styles from './app-sidebar.module.css';
import { getNavigationGroups, type NavigationItem } from './navigation';

function matchesNavigationPath(pathname: string, href: string) {
  return href !== '#' && (pathname === href || pathname.startsWith(`${href}/`));
}

function SidebarNavigationItem({
  item,
  pathname,
  defaultOpen = false,
}: {
  item: NavigationItem;
  pathname: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const activeChild = item.items?.find((child) =>
    matchesNavigationPath(pathname, child.href),
  );
  const isActive = matchesNavigationPath(pathname, item.href) && !activeChild;
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (!activeChild && !matchesNavigationPath(pathname, item.href)) {
      setOpen(false);
    }
  }
  const getAriaCurrent = (href: string) =>
    pathname === href ? ('page' as const) : ('location' as const);
  const Icon = item.icon;

  const button = (
    <SidebarMenuButton
      isActive={isActive}
      render={
        <Link
          href={item.href}
          aria-current={isActive ? getAriaCurrent(item.href) : undefined}
          onClick={item.items ? () => setOpen(true) : undefined}
        />
      }
    >
      <Icon aria-hidden="true" />
      <span>{item.title}</span>
    </SidebarMenuButton>
  );

  if (!item.items) return <SidebarMenuItem>{button}</SidebarMenuItem>;

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={setOpen}
      className="group/navigation"
    >
      <SidebarMenuItem>
        {button}
        <CollapsibleTrigger asChild>
          <SidebarMenuAction
            aria-label={`${open ? 'Collapse' : 'Expand'} ${item.title}`}
          >
            <ChevronDown
              aria-hidden="true"
              className="transition-transform group-data-[state=open]/navigation:rotate-180 motion-reduce:transition-none"
            />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent className={styles.submenu}>
          <SidebarMenuSub>
            {item.items.map((child) => (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton
                  isActive={child === activeChild}
                  render={
                    <Link
                      href={child.href}
                      aria-current={
                        child === activeChild
                          ? getAriaCurrent(child.href)
                          : undefined
                      }
                    />
                  }
                >
                  <span>{child.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar({
  marketplace,
}: {
  marketplace: { slug: string; name: string };
}) {
  const pathname = usePathname();
  const navigationGroups = getNavigationGroups(marketplace.slug);
  const activeGroup = navigationGroups
    .flatMap((group) => group.items)
    .find(
      (item) =>
        item.items &&
        (matchesNavigationPath(pathname, item.href) ||
          item.items.some((child) =>
            matchesNavigationPath(pathname, child.href),
          )),
    );

  return (
    <Sidebar>
      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarNavigationItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    defaultOpen={item === activeGroup}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
