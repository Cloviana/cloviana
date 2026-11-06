import { Bell, CircleHelp, SearchIcon, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { paths } from '@/config/paths';

import { MarketplaceMenu } from './marketplace-menu';

const actions = [
  { label: 'Notifications', icon: Bell },
  { label: 'Support', icon: CircleHelp },
  { label: 'Settings', icon: Settings },
];

export function AppHeader({
  marketplace,
}: {
  marketplace: { slug: string; name: string };
}) {
  return (
    <header
      data-slot="app-header"
      className="border-b-line border-border-default bg-surface grid h-12 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)]"
    >
      <div className="flex items-center gap-1">
        <SidebarTrigger className="-ms-1.5" />
        <Link
          href={paths.mp.home.getHref(marketplace.slug)}
          aria-label="Cloviana home"
          className="focus-visible:ring-border-focused flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-(length:--ds-border-width-focused)"
        >
          <Image
            src="/logo-full.png"
            width={449}
            height={128}
            alt=""
            className="h-5 w-auto"
          />
        </Link>
      </div>

      <InputGroup className="w-full max-w-xl justify-self-center">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="Search"
          aria-label="Search"
        />
      </InputGroup>

      <div className="flex items-center gap-1 justify-self-end">
        {actions.map(({ label, icon: Icon }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            title={label}
          >
            <Icon aria-hidden="true" />
          </Button>
        ))}
        <MarketplaceMenu marketplace={marketplace} />
      </div>
    </header>
  );
}
