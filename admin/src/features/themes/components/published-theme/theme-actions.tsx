'use client';

import { EllipsisIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { RenameThemeDialog } from './rename-theme-dialog';

interface ThemeActionsProps {
  slug: string;
  themeId: string;
  themeName: string;
  storeUrl: string;
  editHref: string;
}

// Duplicate is disabled until it is wired in.
export function ThemeActions({
  slug,
  themeId,
  themeName,
  storeUrl,
  editHref,
}: ThemeActionsProps) {
  const [renameOpen, setRenameOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        variant="overlay"
        nativeButton={false}
        render={<Link href={editHref} />}
        aria-label={`Edit ${themeName}`}
      >
        Edit theme
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="overlay-ghost"
            size="icon-sm"
            aria-label="More theme actions"
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-42">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                View
              </a>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameThemeDialog
        slug={slug}
        themeId={themeId}
        themeName={themeName}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
    </div>
  );
}
