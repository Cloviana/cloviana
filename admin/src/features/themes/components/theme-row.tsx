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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Text } from '@/components/ui/typography';

import { formatAdded } from '../lib/format-added';
import type { Theme } from '../types/theme';

import { RenameThemeDialog } from './published-theme/rename-theme-dialog';

interface ThemeRowProps {
  slug: string;
  theme: Theme;
  editHref: string;
}

export function ThemeRow({ slug, theme, editHref }: ThemeRowProps) {
  const [renameOpen, setRenameOpen] = useState(false);

  return (
    <li className="flex items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 flex-col">
        <Text as="span" className="truncate font-medium">
          {theme.name}
        </Text>
        <Text as="span" variant="caption" className="text-text-subtlest">
          Added: {formatAdded(theme.createdAt)}
        </Text>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="secondary"
          nativeButton={false}
          render={<Link href={editHref} />}
          aria-label={`Edit ${theme.name}`}
        >
          Edit theme
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`More actions for ${theme.name}`}
            >
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-42">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <RenameThemeDialog
        slug={slug}
        themeId={theme.id}
        themeName={theme.name}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
    </li>
  );
}
