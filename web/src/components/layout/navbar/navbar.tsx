'use client';

import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import Link from 'next/link';
import { FC, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { links } from '@/config/links';
import { paths } from '@/config/paths';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

interface NavbarProps {
  className?: string;
}

export const Navbar: FC<NavbarProps> = ({ className }) => {
  const [menuOpened, setMenuOpened] = useState(false);
  const [showBorder, setShowBorder] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setShowBorder(latest > 10);
  });

  return (
    <div className="relative">
      <motion.nav
        className={cn(
          'padding-global bg-background/80 border-zinc-100 py-3 backdrop-blur-md transition-colors duration-300',
          showBorder ? 'border-b' : 'border-b',
          className,
        )}
      >
        <div className="relative container flex items-center gap-4">
          <div className="flex shrink-0">
            <Link href={paths.home.getHref()}>
              <img src="/logo-full.png" alt="Logo" className="h-5" />
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-between">
            {/* Desktop nav (shadcn NavigationMenu) */}
            <div className="hidden items-center md:flex">
              <NavigationMenu viewport={false}>
                <NavigationMenuList className="gap-1">
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href={'#'}
                        className="px-4 py-2 text-sm font-medium"
                      >
                        Blog
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden items-center gap-2 md:flex">
              <Button
                asChild
                variant="primary"
                className="group"
                onClick={() => gaEvent('book_demo', { location: 'navbar' })}
              >
                <Link
                  href={links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Request demo
                </Link>
              </Button>
            </div>

            {/* Mobile */}
            <div className="flex flex-1 items-center justify-end gap-2.5 md:hidden">
              <Button
                onClick={() => setMenuOpened((prevState) => !prevState)}
                variant={'outline'}
                size={'icon'}
              >
                {menuOpened ? (
                  <X className="text-lg" />
                ) : (
                  <Menu className="text-lg" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {menuOpened && (
        <div className={'padding-global bg-background border-b py-5 md:hidden'}>
          <div className={'container flex flex-col gap-6'}>
            <div className="flex flex-col gap-3">
              <Link href={paths.blog.getHref()} className="text-sm font-medium">
                Blog
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                asChild
                variant="primary"
                onClick={() =>
                  gaEvent('book_demo', { location: 'navbar_mobile' })
                }
              >
                <a href={links.demo} target="_blank" rel="noopener noreferrer">
                  Request demo
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
