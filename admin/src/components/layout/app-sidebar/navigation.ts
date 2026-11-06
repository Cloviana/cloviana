import {
  Globe,
  Package,
  ShoppingBag,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { paths } from '@/config/paths';

export type NavigationItem = {
  title: string;
  icon: LucideIcon;
  href: string;
  items?: { title: string; href: string }[];
};

export const getNavigationGroups = (
  slug: string,
): { title: string; items: NavigationItem[] }[] => [
  {
    title: 'Commerce',
    items: [
      {
        title: 'Orders',
        icon: ShoppingBag,
        href: '#',
        items: [
          { title: 'All orders', href: '#' },
          { title: 'Returns', href: '#' },
          { title: 'Refunds', href: '#' },
        ],
      },
      {
        title: 'Products',
        icon: Package,
        href: paths.mp.products.getHref(slug),
        items: [
          { title: 'Categories', href: paths.mp.categories.getHref(slug) },
          { title: 'Offers', href: paths.mp.offers.getHref(slug) },
        ],
      },
      {
        title: 'Stores',
        icon: Store,
        href: paths.mp.stores.getHref(slug),
      },
      {
        title: 'Customers',
        icon: Users,
        href: '#',
        items: [{ title: 'All customers', href: '#' }],
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Marketplace',
        icon: Globe,
        href: paths.mp.themes.getHref(slug),
      },
    ],
  },
];
