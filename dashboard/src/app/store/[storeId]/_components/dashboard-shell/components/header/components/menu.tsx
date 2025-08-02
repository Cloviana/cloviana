'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { MenuBurgerIcon } from '@/components/icons';

import { Sidebar } from '../../sidebar';

export const Menu = () => {
  const [open, setOpen] = useState(false);

  // Variants for the slide-up panel
  const panelVariants = {
    hidden: { y: '100%' },
    visible: { y: 0 },
    exit: { y: '100%' },
  };

  // Optional: fade-down backdrop
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className="block md:hidden">
      <button
        className="flex size-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-surface-200"
        onClick={() => setOpen(true)}
      >
        <MenuBurgerIcon
          width={15}
          height={15}
          className="fill-foreground-lighter"
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-white/30 backdrop-blur"
              onClick={() => setOpen(false)}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={backdropVariants}
              transition={{ duration: 0.2 }}
            />

            {/* sliding panel */}
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 flex h-[85%] flex-col gap-y-3 overflow-y-auto rounded-t-lg border border-border bg-background"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={panelVariants}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
