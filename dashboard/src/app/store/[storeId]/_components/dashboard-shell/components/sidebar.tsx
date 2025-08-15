'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ElementType, FC } from 'react';

import {
  KeyIcon,
  LayerPlusIcon,
  ShopIcon,
  SignatureIcon,
} from '@/components/icons';
import { paths } from '@/config/paths';
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
    <aside className="flex size-full flex-col gap-y-3 p-2.5">
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
      </div>
    </aside>
  );
};
