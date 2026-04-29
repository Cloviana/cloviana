'use client';

import {
  LayoutDashboard,
  MessageCircleQuestionMark,
  Settings,
} from 'lucide-react';
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
import { BusinessChip } from '@/features/businesses/components/business-chip';

import { NavMain } from './components/nav-main';
import { NavSecondary } from './components/nav-secondary';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { businessId } = useParams<{ businessId: string }>();
  const pathname = usePathname();

  const navMain = [
    {
      title: 'Dashboard',
      url: paths.business.getHref(businessId),
      icon: LayoutDashboard,
      isActive: pathname === paths.business.getHref(businessId),
    },
  ];

  const navSecondary = [
    {
      title: 'Settings',
      url: paths.business.settings.getHref(businessId),
      isActive: pathname.startsWith(
        paths.business.settings.getHref(businessId),
      ),
      icon: Settings,
      items: [
        {
          title: 'Subscription',
          url: paths.business.settings.subscription.getHref(businessId),
          isActive: pathname.startsWith(
            paths.business.settings.subscription.getHref(businessId),
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
        <BusinessChip />
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
