'use client';

import Link from 'next/link';
import { FC, useState } from 'react';

import { Button } from '@/components/actions';
import { GIcon } from '@/components/icons';
import { links } from '@/config/links';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

import { NavItem } from './components/nav-item';

interface NavbarProps {
  className?: string;
}

export const Navbar: FC<NavbarProps> = ({ className }) => {
  const [menuOpened, setMenuOpened] = useState(false);

  return (
    <div className="relative">
      <nav className={cn('padding-global border-b-[1px] py-2.5', className)}>
        <div className="container flex items-center px-0">
          <div className="flex w-32 shrink-0">
            <Link href={paths.home.getHref()}>
              <img src="/logo-full.png" alt="Logo" className="w-18" />
            </Link>
          </div>
          <div className="hidden flex-1 items-center justify-between [@media(min-width:860px)]:flex">
            <div className="flex items-center">
              <NavItem type="link" href={paths.home.getHref()}>
                Home
              </NavItem>
              <NavItem type="dropdown">Products</NavItem>
              <NavItem type="link" href={paths.home.getHref()}>
                Case Studies
              </NavItem>
              <NavItem type="link" href={paths.home.getHref()}>
                Blog
              </NavItem>
              <NavItem type="link" href={paths.home.getHref()}>
                Support
              </NavItem>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href={links.demo}>Book demo</Link>
              </Button>
              <Button asChild className="group">
                <a
                  href={paths.auth.signup.getHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get started
                  <GIcon
                    name="arrow_forward"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              </Button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2.5 [@media(min-width:860px)]:hidden">
            <Button asChild>
              <Link href={paths.auth.signup.getHref()}>Get started</Link>
            </Button>
            <Button
              onClick={() => setMenuOpened((prevState) => !prevState)}
              variant={'outline'}
              size={'icon'}
            >
              <GIcon
                name={menuOpened ? 'close' : 'menu'}
                size={20}
                className="text-foreground-light"
              />
            </Button>
          </div>
        </div>
      </nav>
      {menuOpened && (
        <div className={'border-b py-5 [@media(min-width:860px)]:hidden'}>
          <div className={'padding-global container flex flex-col gap-6 px-0'}>
            <div className="flex flex-col gap-3">
              <NavItem as="mobile" type="link" href={paths.home.getHref()}>
                Home
              </NavItem>
              <NavItem as="mobile" type="dropdown">
                Products
              </NavItem>
              <NavItem as="mobile" type="link" href={paths.home.getHref()}>
                Case Studies
              </NavItem>
              <NavItem as="mobile" type="link" href={paths.home.getHref()}>
                Blog
              </NavItem>
              <NavItem as="mobile" type="link" href={paths.home.getHref()}>
                Support
              </NavItem>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild variant="ghost">
                <a href={links.demo} target="_blank" rel="noopener noreferrer">
                  Request a demo
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
