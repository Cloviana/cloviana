'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';

type FlowHeaderProps =
  | { onExit: () => void; href?: never; title?: ReactNode }
  | { href: string; onExit?: never; title?: ReactNode };

export function FlowHeader({ href, onExit, title }: FlowHeaderProps) {
  const params = useParams<{ businessId?: string }>();
  const resolvedhref = href ?? paths.business.getHref(params.businessId);

  const exitButton = (
    <>
      <X strokeWidth={2.2} />
      <span className="sr-only">Exit</span>
    </>
  );

  return (
    <nav className="flex items-center justify-between px-5 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        {onExit ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={onExit}
          >
            {exitButton}
          </Button>
        ) : (
          <Button
            asChild
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
          >
            <Link href={resolvedhref}>{exitButton}</Link>
          </Button>
        )}

        {title ? (
          <div className="text-foreground truncate text-sm font-medium">
            {title}
          </div>
        ) : null}
      </div>

      {/*<MinimalAccountChip /> */}
    </nav>
  );
}
