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
          'padding-global bg-white/90 py-2.5 backdrop-blur transition-colors duration-300',
          showBorder ? 'border-b' : 'border-b border-transparent',
          className,
        )}
      >
        <div className="relative container mx-auto flex items-center gap-4 px-0">
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
                      <Link href="#" className="px-4 py-2 text-sm font-medium">
                        Home
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="px-4 py-2 text-sm font-medium">
                        Case Studies
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="px-4 py-2 text-sm font-medium">
                        Blog
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="px-4 py-2 text-sm font-medium">
                        Support
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
                size={'lg'}
                variant="primary"
                className="group rounded-full"
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
                asChild
                onClick={() =>
                  gaEvent('sign_up', { location: 'navbar_mobile' })
                }
              >
                <Link href={paths.auth.signup.getHref()}>Get started</Link>
              </Button>
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
        <div className={'border-b bg-white py-5 md:hidden'}>
          <div className={'padding-global container flex flex-col gap-6 px-0'}>
            <div className="flex flex-col gap-3">
              <Link href={paths.home.getHref()} className="text-sm font-medium">
                Home
              </Link>
              <Link href={paths.home.getHref()} className="text-sm font-medium">
                Case Studies
              </Link>
              <Link href={paths.home.getHref()} className="text-sm font-medium">
                Blog
              </Link>
              <Link href={paths.home.getHref()} className="text-sm font-medium">
                Support
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
                  Book a demo
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
