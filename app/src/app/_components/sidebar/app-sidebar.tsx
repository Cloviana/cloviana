'use client';

import { Feather, MessageCircleQuestionMark } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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
import { AccountChip } from '@/features/auth/components/account-chip';
import { StoreChip } from '@/features/stores/components/store-chip';

import { NavMain } from './components/nav-main';
import { NavSecondary } from './components/nav-secondary';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { storeId } = useParams<{ storeId: string }>();
  const pathname = usePathname();

  const navMain = [
    {
      title: 'Content',
      url: paths.store.blogs.getHref(storeId),
      icon: Feather,
      isActive: pathname.startsWith(paths.store.blogs.getHref(storeId)),
    },
  ];

  const navSecondary = [
    {
      title: 'Ask for help',
      url: `mailto:${SUPPORT_EMAIL}`,
      icon: MessageCircleQuestionMark,
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex shrink-0 items-center gap-x-2">
          <Link href={paths.store.getHref(storeId)}>
            <Image
              src="/logo-icon.png"
              width={125}
              height={125}
              alt="Cloviana Logo"
              className="size-[18px]"
            />
          </Link>
          <StoreChip className="flex-1" />
          <AccountChip />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
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
