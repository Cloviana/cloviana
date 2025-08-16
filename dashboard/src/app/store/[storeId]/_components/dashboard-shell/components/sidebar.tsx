'use client';

import * as Accordion from '@radix-ui/react-accordion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FC } from 'react';

import { SUPPORT_EMAIL } from '../../../shared/models/constants';
import {
  NavGroup,
  SidebarItemProps,
} from '../../../shared/models/sidebar-interface';
import { useGenerateSidebarMenu } from '../../../shared/usecases/use-generate-sidebar-menu';

import { Logo } from './header/components/logo';

const ArrowRightIcon = dynamic(() => import('@mui/icons-material/ArrowRight'), {
  ssr: false,
});

const QuestionMarkIcon = dynamic(
  () => import('@mui/icons-material/QuestionMark'),
  {
    ssr: false,
  },
);

const SidebarItem: FC<SidebarItemProps> = ({
  label,
  href,
  icon: Icon,
  isActive,
  disabled,
}) => (
  <Link
    href={disabled ? '#' : href}
    aria-disabled={disabled}
    data-state={isActive ? 'active' : undefined}
    className={[
      'flex w-full items-center gap-x-2 rounded-lg px-3 py-1.5 transition-all hover:bg-[#eeeeee]',
      isActive ? 'bg-[#e8e8e8]' : '',
      disabled ? 'pointer-events-none cursor-not-allowed opacity-50' : '',
    ].join(' ')}
  >
    <Icon
      width={14}
      height={14}
      className={isActive ? 'fill-foreground' : 'fill-foreground-lighter'}
    />
    <span className="text-sm font-medium text-foreground">{label}</span>
  </Link>
);

const SidebarGroup: FC<{ group: NavGroup }> = ({ group }) => (
  <Accordion.Item value={group.id} className="border-none">
    <Accordion.Header>
      <Accordion.Trigger className="group flex w-full items-center rounded-md px-2 py-1.5 text-[11px] tracking-wide text-foreground transition-colors hover:bg-[#eeeeee]">
        <span>{group.label}</span>
        <ArrowRightIcon
          sx={{
            fontSize: 15,
          }}
          className="transition-transform duration-200 group-data-[state=open]:rotate-90"
        />
      </Accordion.Trigger>
    </Accordion.Header>

    <Accordion.Content className="accordion-motion">
      <div className="ml-1.5 mt-1 flex flex-col gap-y-1">
        {group.items.map((item) => (
          <SidebarItem key={`${group.id}-${item.label}`} {...item} />
        ))}
      </div>
    </Accordion.Content>
  </Accordion.Item>
);

export const Sidebar: FC = () => {
  const { groups, defaultOpen } = useGenerateSidebarMenu();

  return (
    <aside className="flex size-full flex-col bg-[#f5f5f5]">
      <div className="sticky top-0 z-10 bg-[#f5f5f5] p-2.5">
        <div className="flex items-center justify-between gap-2">
          <Logo />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto scroll-smooth px-2.5 pb-2.5">
        <Accordion.Root
          type="multiple"
          defaultValue={defaultOpen}
          className="flex flex-col gap-y-3 pb-16"
        >
          {groups.map((group) => (
            <SidebarGroup key={group.id} group={group} />
          ))}
        </Accordion.Root>

        <div className="sticky bottom-0 justify-end">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Support request')}`}
            aria-label="Contact support"
            className="flex size-6 items-center justify-center rounded-full border border-gray-300 bg-[#f5f5f5] p-2 transition-colors hover:bg-[#eeeeee]"
          >
            <QuestionMarkIcon fontSize="inherit" />
          </a>
        </div>
      </div>
    </aside>
  );
};
