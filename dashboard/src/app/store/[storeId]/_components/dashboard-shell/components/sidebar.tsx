'use client';

import * as Separator from '@radix-ui/react-separator';
import { AuthUser } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ElementType, FC, useEffect, useState } from 'react';

import { useGetStore } from '@/api/stores/get-store';
import {
  KeyIcon,
  LayerPlusIcon,
  ShopIcon,
  SignatureIcon,
} from '@/components/icons';
import { paths } from '@/config/paths';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/utils/cn';

import { Logo } from './header/components/logo';

type IconComponent = ElementType;

interface NavItem {
  label: string;
  href: string;
  icon: IconComponent;
  isActive: boolean;
}

interface SidebarSectionProps {
  items: NavItem[];
}

interface SidebarItemProps extends NavItem {}

const SidebarItem: FC<SidebarItemProps> = ({
  label,
  href,
  icon: Icon,
  isActive,
}) => (
  <Link
    href={href}
    data-state={isActive ? 'active' : undefined}
    className={`flex w-full items-center gap-x-2 rounded-lg px-3 py-1.5 transition-all hover:bg-surface-200 ${
      isActive ? 'bg-surface-200' : ''
    }`}
  >
    <Icon
      width={14}
      height={14}
      className={isActive ? 'fill-foreground' : 'fill-foreground-lighter'}
    />
    <span
      className={cn(
        isActive ? 'text-foreground' : 'text-foreground-lighter',
        'text-sm font-medium',
      )}
    >
      {label}
    </span>
  </Link>
);

const SidebarSection: FC<SidebarSectionProps> = ({ items }) => (
  <div className="flex flex-col gap-y-1">
    {items.map((item) => (
      <SidebarItem key={item.label} {...item} />
    ))}
  </div>
);

export const Sidebar: FC = () => {
  const pathname = usePathname();
  const params = useParams();
  const storeId = params.storeId as string;
  const supabase = createClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabase.auth]);

  const { isLoading: storeLoading } = useGetStore(storeId as string);
  if (loading || !user || storeLoading)
    return <div className="h-7 w-36 animate-pulse rounded-md bg-surface-200" />;

  const { email } = user;

  const mainNav: NavItem[] = [
    {
      label: 'Brand Overview',
      icon: ShopIcon,
      href: paths.store.getHref(storeId),
      isActive: pathname === paths.store.getHref(storeId),
    },
    {
      label: 'Blogs',
      icon: SignatureIcon,
      href: paths.store.blogs.getHref(storeId),
      isActive: pathname.startsWith(paths.store.blogs.getHref(storeId)),
    },
    {
      label: 'Keywords',
      icon: KeyIcon,
      href: paths.store.keywords.getHref(storeId),
      isActive: pathname.startsWith(paths.store.keywords.getHref(storeId)),
    },
    {
      label: 'Integrations',
      icon: LayerPlusIcon,
      href: paths.store.integrations.getHref(storeId),
      isActive: pathname.startsWith(paths.store.integrations.getHref(storeId)),
    },
  ];

  return (
    <aside className="flex size-full flex-col gap-y-3 bg-gray-50 p-2.5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <Logo />
        </div>
        <SidebarSection items={mainNav} />
      </div>

      <div className="flex flex-1 flex-col justify-end">
        <p className="text-center text-[10px] text-foreground-light">
          Desktop-first dashboard; mobile support coming soon. Use a laptop for
          the best experience—stay tuned for new features!
        </p>
        <Separator.Root className="my-[15px] bg-gray-300 data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px" />
        <span className="text-xs text-foreground-light">{email}</span>
      </div>
    </aside>
  );
};
