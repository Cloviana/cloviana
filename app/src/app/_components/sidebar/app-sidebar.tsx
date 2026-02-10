'use client';

import { Globe, MessageCircleQuestionMark, Settings } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { paths } from '@/config/paths';
import { SUPPORT_EMAIL } from '@/constants/emails';
import { StoreChip } from '@/features/stores/components/store-chip';

import { NavMain } from './components/nav-main';
import { NavSecondary } from './components/nav-secondary';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { storeId } = useParams<{ storeId: string }>();
  const pathname = usePathname();

  const navMain = [
    {
      title: 'Blog posts',
      url: paths.store.blogs.getHref(storeId),
      icon: Globe,
      isActive: pathname.startsWith(paths.store.blogs.getHref(storeId)),
    },
  ];

  const navSecondary = [
    {
      title: 'Settings',
      url: paths.store.settings.getHref(storeId),
      isActive: pathname.startsWith(paths.store.settings.getHref(storeId)),
      icon: Settings,
      items: [
        {
          title: 'Integrations',
          url: paths.store.settings.integrations.getHref(storeId),
          isActive: pathname.startsWith(
            paths.store.settings.integrations.getHref(storeId),
          ),
        },
        {
          title: 'Automation',
          url: paths.store.settings.automation.getHref(storeId),
          isActive: pathname.startsWith(
            paths.store.settings.automation.getHref(storeId),
          ),
        },
      ],
    },
    {
      title: 'Ask for help',
      url: `mailto:${SUPPORT_EMAIL}`,
      icon: MessageCircleQuestionMark,
      isActive: false,
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <StoreChip />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <div className="text-foreground-light text-left text-[11px]">
          <p>
            We&apos;re moving quickly to deliver value during the pilot. Please
            contact{' '}
            <a
              className="text-secondary font-medium underline hover:opacity-80"
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
