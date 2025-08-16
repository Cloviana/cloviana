import { useParams, usePathname } from 'next/navigation';

import {
  KeyIcon,
  LayerPlusIcon,
  ShopIcon,
  SignatureIcon,
} from '@/components/icons';
import { paths } from '@/config/paths';

import { NavGroup, NavItem } from '../models/sidebar-interface';

export const useGenerateSidebarMenu = () => {
  const pathname = usePathname();
  const params = useParams();
  const storeId = params.storeId as string;
  const brandItems: NavItem[] = [
    {
      label: 'Brand Overview',
      icon: ShopIcon,
      href: paths.store.getHref(storeId),
      isActive: pathname === paths.store.getHref(storeId),
    },
    // placeholders
    {
      label: 'Analytics (Soon)',
      icon: LayerPlusIcon,
      href: '#',
      isActive: false,
      disabled: true,
    },
  ];

  const contentItems: NavItem[] = [
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
    // placeholders
    {
      label: 'Collections',
      icon: SignatureIcon,
      href: '#',
      isActive: false,
      disabled: true,
    },
    {
      label: 'Media Library',
      icon: LayerPlusIcon,
      href: '#',
      isActive: false,
      disabled: true,
    },
  ];

  const operationsItems: NavItem[] = [
    {
      label: 'Orders',
      icon: LayerPlusIcon,
      href: '#',
      isActive: false,
      disabled: true,
    },
    {
      label: 'Customers',
      icon: LayerPlusIcon,
      href: '#',
      isActive: false,
      disabled: true,
    },
    {
      label: 'Reports',
      icon: ShopIcon,
      href: '#',
      isActive: false,
      disabled: true,
    },
    {
      label: 'Discounts',
      icon: KeyIcon,
      href: '#',
      isActive: false,
      disabled: true,
    },
  ];

  const integrationItems: NavItem[] = [
    {
      label: 'Integrations',
      icon: LayerPlusIcon,
      href: paths.store.integrations.getHref(storeId),
      isActive: pathname.startsWith(paths.store.integrations.getHref(storeId)),
    },
    // placeholders
    {
      label: 'Webhooks (Soon)',
      icon: KeyIcon,
      href: '#',
      isActive: false,
      disabled: true,
    },
  ];

  const groups: NavGroup[] = [
    { id: 'brand', label: 'Brand', items: brandItems },
    { id: 'content', label: 'Content', items: contentItems },
    { id: 'operations', label: 'Operations', items: operationsItems },
    { id: 'integrations', label: 'Integrations', items: integrationItems },
  ];

  const defaultOpen = groups.map((g) => g.id);
  return {
    groups,
    defaultOpen,
  };
};
