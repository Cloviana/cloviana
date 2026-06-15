'use client';

import {
  Activity,
  BarChart3,
  Globe,
  LayoutDashboard,
  Link2,
  MessageCircleQuestionMark,
  MessageSquare,
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
      title: 'Overview',
      url: paths.business.getHref(businessId),
      icon: LayoutDashboard,
      isActive: pathname === paths.business.getHref(businessId),
    },
    {
      title: 'Prompts',
      url: `${paths.business.getHref(businessId)}/prompts`,
      icon: MessageSquare,
      isActive: pathname === `${paths.business.getHref(businessId)}/prompts`,
    },
    {
      title: 'Domains',
      url: `${paths.business.getHref(businessId)}/domains`,
      icon: Globe,
      isActive: pathname === `${paths.business.getHref(businessId)}/domains`,
    },
    {
      title: 'URLs',
      url: `${paths.business.getHref(businessId)}/urls`,
      icon: Link2,
      isActive: pathname === `${paths.business.getHref(businessId)}/urls`,
    },
    {
      title: 'Gap analysis',
      url: `${paths.business.getHref(businessId)}/gap`,
      icon: BarChart3,
      isActive: pathname === `${paths.business.getHref(businessId)}/gap`,
    },
    {
      title: 'Insights',
      url: `${paths.business.getHref(businessId)}/insights`,
      icon: Activity,
      isActive: pathname === `${paths.business.getHref(businessId)}/insights`,
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
