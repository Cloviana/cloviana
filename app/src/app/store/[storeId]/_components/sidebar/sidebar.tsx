'use client';

import { useParams, usePathname } from 'next/navigation';
import { FC } from 'react';

import { paths } from '@/config/paths';
import { SUPPORT_EMAIL } from '@/constants/emails';

import { SidebarGroup } from './components/sidebar-group';
import { SidebarItem } from './components/sidebar-item';
import { SidebarStoreDropwdown } from './components/sidebar-store-dropdown';

export const Sidebar: FC = () => {
  const pathname = usePathname();
  const { storeId } = useParams<{ storeId: string }>();

  return (
    <aside className="flex size-full flex-col gap-3 px-2.5 py-4">
      <SidebarStoreDropwdown storeId={storeId} />
      <div className="no-scrollbar mt-2 flex min-h-0 flex-1 flex-col gap-y-2 overflow-y-auto scroll-smooth">
        <SidebarItem
          icon="overview_key"
          label="Overview"
          href={paths.store.getHref(storeId)}
          isActive={pathname === paths.store.getHref(storeId)}
        />
        <SidebarGroup label="Store">
          <SidebarItem
            icon="package_2"
            label="Products"
            href={paths.store.products.getHref(storeId)}
            isActive={pathname.startsWith(
              paths.store.products.getHref(storeId),
            )}
          />
          <SidebarItem
            icon="nest_true_radiant"
            label="Integrations"
            href={paths.store.integrations.getHref(storeId)}
            isActive={pathname.startsWith(
              paths.store.integrations.getHref(storeId),
            )}
          />
        </SidebarGroup>
        <SidebarGroup label="SEO">
          <SidebarItem
            icon="key"
            label="Keywords"
            href={paths.store.keywords.getHref(storeId)}
            isActive={pathname.startsWith(
              paths.store.keywords.getHref(storeId),
            )}
          />
          <SidebarItem
            icon="crossword"
            label="Blog Posts"
            href={paths.store.blogs.getHref(storeId)}
            isActive={pathname.startsWith(paths.store.blogs.getHref(storeId))}
          />
          <SidebarItem
            icon="add_link"
            label="Backlinks"
            href={'#'}
            isActive={false}
            disabled
          />
          <SidebarItem
            icon="person_search"
            label="Competitors"
            href={'#'}
            isActive={false}
            disabled
          />
          <SidebarItem
            icon="reviews"
            label="Reviews"
            href={'#'}
            isActive={false}
            disabled
          />
          <SidebarItem
            icon="graphic_eq"
            label="Brand Voices"
            href={'#'}
            isActive={false}
            disabled
          />
        </SidebarGroup>
        <SidebarGroup label="Report">
          <SidebarItem
            icon="note_stack"
            label="Site Audit"
            href={'#'}
            isActive={false}
            disabled
          />
          <SidebarItem
            icon="web_traffic"
            label="Analytics"
            href={'#'}
            isActive={false}
            disabled
          />
        </SidebarGroup>
      </div>
      <div className="flex px-2.5">
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Support request')}`}
          aria-label="Contact support"
          className="flex items-center justify-center rounded-full"
        >
          <p className="text-center text-[10px] text-sidebar-item-foreground">
            Desktop-first dashboard; mobile support coming soon. Use a laptop
            for the best experience—stay tuned for new features!
          </p>
        </a>
      </div>
    </aside>
  );
};
