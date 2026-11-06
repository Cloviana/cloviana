'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function MarketplaceMenu({
  marketplace,
}: {
  marketplace: { slug: string; name: string };
}) {
  const initials = marketplace.name.trim().slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="min-w-0 gap-2 px-1"
          aria-label={`Open marketplace menu for ${marketplace.name}`}
          title={marketplace.name}
        >
          <Avatar className="size-5! rounded-md" aria-hidden="true">
            <AvatarImage
              src={`https://${marketplace.slug}.cloviana.com/favicon.ico`}
              alt=""
              className="object-contain"
            />
            <AvatarFallback className="bg-background-accent-purple-subtler text-text-accent-purple-bolder rounded-md text-[10px] leading-none font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-40 truncate">{marketplace.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="min-h-24 w-56"
        aria-label="Marketplace menu"
      />
    </DropdownMenu>
  );
}
