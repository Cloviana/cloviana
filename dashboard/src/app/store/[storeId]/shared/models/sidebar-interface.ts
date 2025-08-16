import { ElementType } from 'react';

type IconComponent = ElementType;

export interface NavItem {
  label: string;
  href: string;
  icon: IconComponent;
  isActive: boolean;
  disabled?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export interface SidebarItemProps extends NavItem {}
