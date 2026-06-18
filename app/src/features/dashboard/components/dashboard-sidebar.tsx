'use client';

import {
  LayoutDashboard,
  MessageSquare,
  Globe,
  Link as LinkIcon,
  BarChart,
  Activity,
  Settings,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';

type SidebarItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

const MAIN_NAV: SidebarItem[] = [
  { name: 'Overview', href: '', icon: LayoutDashboard },
  { name: 'Prompts', href: '/prompts', icon: MessageSquare },
];

const SOURCES_NAV: SidebarItem[] = [
  { name: 'Domains', href: '/domains', icon: Globe },
  { name: 'URLs', href: '/urls', icon: LinkIcon },
  { name: 'Gap analysis', href: '/gap', icon: BarChart },
];

const BRAND_NAV: SidebarItem[] = [
  { name: 'Insights', href: '/insights', icon: Activity },
];

export function DashboardSidebar({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const basePath = paths.business.getHref(businessId);

  const isActive = (path: string) => {
    if (path === '') {
      return pathname === basePath;
    }
    return pathname.startsWith(`${basePath}${path}`);
  };

  const NavGroup = ({
    title,
    items,
  }: {
    title: string;
    items: SidebarItem[];
  }) => (
    <div className="mb-6">
      <h3 className="mb-2 px-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={`${basePath}${item.href}`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-slate-100 text-slate-950'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
              )}
            >
              <item.icon
                className={cn(
                  'size-4',
                  active ? 'text-slate-950' : 'text-slate-400',
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-6">
        <Image
          src="/logo-icon.png"
          width={125}
          height={125}
          alt="Cloviana"
          className="size-[22px]"
        />
        <span className="font-semibold text-slate-950">Cloviana</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <NavGroup title="General" items={MAIN_NAV} />
        <NavGroup title="Sources" items={SOURCES_NAV} />
        <NavGroup title="Brand" items={BRAND_NAV} />
      </div>

      <div className="border-t border-slate-200 p-4">
        <Link
          href={paths.business.settings.getHref(businessId)}
          className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
        >
          <Settings className="size-4 text-slate-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
