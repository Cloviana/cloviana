'use client';

import {
  motion,
  useScroll,
  useMotionValueEvent,
  HTMLMotionProps,
} from 'framer-motion';
import { FC, useState } from 'react';

import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import { Button, ButtonGroup } from '../actions';

interface NavbarProps extends HTMLMotionProps<'nav'> {}

export const Navbar: FC<NavbarProps> = ({ className, ...props }) => {
  const { scrollY } = useScroll();
  const [intercepted, setIntercepted] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => {
    setIntercepted(y > 80);
  });

  return (
    <motion.nav
      className={cn(
        'sticky left-0 top-5 z-50 mx-auto w-full rounded-full bg-white/90 px-5 backdrop-blur transition-all',
        intercepted ? 'max-w-[1280px] shadow' : 'max-w-[1340px]',
        className,
      )}
      style={{ WebkitBackdropFilter: 'blur(8px)' }}
      {...props}
    >
      <div className="flex h-14 w-full items-center justify-between">
        <img src="/logo-full.png" className="h-[22px]" alt="logo" />
        <ButtonGroup>
          <Button variant="tertiary" url={paths.auth.login.getHref()}>
            Log in
          </Button>
          <Button variant="primary" url={paths.auth.signup.getHref()}>
            Start free trial
          </Button>
        </ButtonGroup>
      </div>
    </motion.nav>
  );
};
