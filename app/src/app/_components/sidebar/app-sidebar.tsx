'use client';

import { BookCopy, Tags } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { paths } from '@/config/paths';
import { SUPPORT_EMAIL } from '@/constants/emails';

import { NavMain } from './components/nav-main';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { storeId } = useParams<{ storeId: string }>();
  const pathname = usePathname();

  const navMain = [
    {
      title: 'Content',
      url: paths.store.blogs.getHref(storeId),
      icon: BookCopy,
      isActive: pathname.startsWith(paths.store.blogs.getHref(storeId)),
    },
    {
      title: 'Catalog',
      url: paths.store.catalog.getHref(storeId),
      isActive: pathname.startsWith(paths.store.catalog.getHref(storeId)),
      icon: Tags,
      disabled: true,
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="text-foreground-light text-center text-[11px]">
          <p>
            We&apos;re moving quickly to deliver value during the pilot. Please
            contact{' '}
            <a
              className="text-foreground font-medium underline hover:opacity-80"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>{' '}
            with any feedback or feature requests.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
