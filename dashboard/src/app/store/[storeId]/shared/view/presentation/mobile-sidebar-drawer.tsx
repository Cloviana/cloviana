'use client';

import * as Dialog from '@radix-ui/react-dialog';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Sidebar } from '../../../_components/dashboard-shell/components/sidebar';

const AutoAwesomeMosaicIcon = dynamic(
  () => import('@mui/icons-material/AutoAwesomeMosaic'),
  {
    ssr: false,
  },
);

export function MobileSidebarDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Open menu"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-black/5 active:scale-[.98] md:hidden"
        >
          <AutoAwesomeMosaicIcon fontSize="small" className="text-foreground" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />

        <Dialog.Content
          className="drawer-content flex flex-col"
          aria-label="Mobile sidebar"
        >
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
