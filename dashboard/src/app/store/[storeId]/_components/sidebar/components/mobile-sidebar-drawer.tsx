'use client';

import {
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
} from '@radix-ui/react-dialog';

import { GIcon } from '@/components/icons';

import { Sidebar } from '../sidebar';

export function MobileSidebarDrawer() {
  return (
    <Root>
      <Trigger asChild>
        <button
          aria-label="Open menu"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-black/5 active:scale-95 md:hidden"
        >
          <GIcon name="thumbnail_bar" className="text-foreground-light" />
        </button>
      </Trigger>

      <Portal>
        <Overlay className="drawer-overlay" />
        <Content
          aria-label="Mobile sidebar"
          className="drawer-content flex flex-col"
        >
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </Content>
      </Portal>
    </Root>
  );
}
