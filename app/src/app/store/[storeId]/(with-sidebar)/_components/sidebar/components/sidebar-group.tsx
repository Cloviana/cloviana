'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { FC, ReactNode } from 'react';

import { GIcon } from '@/components/deprecated/icons';

export interface SidebarGroupProps {
  label: string;
  children: ReactNode;
}

export const SidebarGroup: FC<SidebarGroupProps> = ({ label, children }) => (
  <Accordion.Root type="single" defaultValue={label} collapsible>
    <Accordion.Item value={label} className="flex flex-col gap-y-1">
      <Accordion.Header>
        <Accordion.Trigger className="text-sidebar-item-foreground hover:bg-sidebar-item-hover group flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-[13px] font-medium transition-colors">
          {label}
          <GIcon
            name="chevron_right"
            size={14}
            className="transition-transform group-data-[state=open]:rotate-90"
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="accordion-motion">
        <div className="flex flex-col gap-y-px">{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>
);
