import Link from 'next/link';
import { FC, ReactNode } from 'react';

import { GIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

type NavItemCommon = {
  className?: string;
  children?: ReactNode;
  as?: 'desktop' | 'mobile';
};

type NavItemDropdown = {
  type: 'dropdown';
} & NavItemCommon;

type NavItemLink = {
  type: 'link';
  href: string;
} & NavItemCommon;

type NavItem = NavItemDropdown | NavItemLink;

export const NavItem: FC<NavItem> = ({
  type,
  className,
  as = 'desktop',
  ...props
}) => {
  const navItemRootClassname =
    'group text-sm transition-colors text-foreground font-medium cursor-pointer hover:bg-zinc-100 px-3 py-1 rounded';

  if (as === 'mobile') {
    console.log(as);
    const { href, children } = props as NavItemLink;
    return (
      <Link href={href || '#'} className={cn('text-lg font-medium', className)}>
        {children}
      </Link>
    );
  }

  if (type === 'link') {
    const { href, children } = props as NavItemLink;
    return (
      <Link href={href} className={cn(navItemRootClassname, className)}>
        {children}
      </Link>
    );
  }

  const { children } = props as NavItemDropdown;
  return (
    <button
      type="button"
      className={cn(
        navItemRootClassname,
        'hover:text-foreground flex items-center gap-1 hover:font-medium',
        className,
      )}
    >
      {children}
      <GIcon name="keyboard_arrow_down" className="text-current" />
    </button>
  );
};
